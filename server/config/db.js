const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Use direct PostgreSQL connection if DATABASE_URL is set (for Railway)
// Otherwise fall back to Supabase JS client (for local dev)
let supabase;

if (process.env.DATABASE_URL) {
  // Direct pg connection - wrap it to mimic Supabase client interface
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Minimal Supabase-compatible wrapper using raw pg
  supabase = {
    from: (table) => new QueryBuilder(pool, table),
    rpc: async (fn, args) => {
      try {
        await pool.query(`SELECT ${fn}($1)`, [args?.msg_id]);
        return { data: null, error: null };
      } catch (e) {
        return { data: null, error: e };
      }
    }
  };

  console.log('[DB] Using direct PostgreSQL connection via DATABASE_URL');
} else {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  console.log('[DB] Using Supabase JS client');
}

class QueryBuilder {
  constructor(pool, table) {
    this.pool = pool;
    this.table = table;
    this._select = '*';
    this._conditions = [];
    this._params = [];
    this._order = null;
    this._limit = null;
    this._single = false;
    this._insert = null;
    this._update = null;
    this._delete = false;
    this._upsert = null;
    this._upsertConflict = null;
    this._countOnly = false;
    this._head = false;
    this._in = null;
    this._paramIndex = 1;
  }

  select(cols, opts = {}) {
    // Parse Supabase-style joins like 'id, name, users(name)'
    this._select = this._parseSelect(cols);
    if (opts.count === 'exact') this._countOnly = true;
    if (opts.head) this._head = true;
    return this;
  }

  _parseSelect(cols) {
    if (!cols || cols === '*') return '*';
    // Remove nested relation selects for now - just get base columns
    return cols.split(',').map(c => {
      c = c.trim();
      if (c.includes('(')) return null; // skip joins
      if (c.includes(':')) return c.split(':')[1].trim(); // handle aliases
      return c;
    }).filter(Boolean).join(', ') || '*';
  }

  insert(data) {
    this._insert = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this._update = data;
    return this;
  }

  delete() {
    this._delete = true;
    return this;
  }

  upsert(data, opts = {}) {
    this._upsert = Array.isArray(data) ? data : [data];
    this._upsertConflict = opts.onConflict;
    return this;
  }

  eq(col, val) {
    this._conditions.push({ col, op: '=', val });
    return this;
  }

  neq(col, val) {
    this._conditions.push({ col, op: '!=', val });
    return this;
  }

  gt(col, val) {
    this._conditions.push({ col, op: '>', val });
    return this;
  }

  gte(col, val) {
    this._conditions.push({ col, op: '>=', val });
    return this;
  }

  lte(col, val) {
    this._conditions.push({ col, op: '<=', val });
    return this;
  }

  lt(col, val) {
    this._conditions.push({ col, op: '<', val });
    return this;
  }

  is(col, val) {
    this._conditions.push({ col, op: 'IS', val });
    return this;
  }

  in(col, vals) {
    this._conditions.push({ col, op: 'IN', val: vals });
    return this;
  }

  or(filter) {
    this._conditions.push({ raw: filter });
    return this;
  }

  ilike(col, pattern) {
    this._conditions.push({ col, op: 'ILIKE', val: pattern });
    return this;
  }

  not(col, op, val) {
    this._conditions.push({ col, op: `NOT ${op}`, val });
    return this;
  }

  order(col, opts = {}) {
    this._order = `"${col}" ${opts.ascending === false ? 'DESC' : 'ASC'}`;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    this._limit = 1;
    return this;
  }

  _buildWhere() {
    if (!this._conditions.length) return { where: '', params: [] };
    const params = [];
    let idx = 1;
    const parts = this._conditions.map(c => {
      if (c.raw) {
        // Parse simple or() filters like 'col.eq.val,col2.eq.val2'
        const orParts = c.raw.split(',').map(part => {
          const m = part.match(/(\w+)\.(eq|ilike|neq|gt|gte|lte|lt|is)\.(.+)/);
          if (!m) return null;
          const [, col, op, val] = m;
          const pgOp = { eq: '=', ilike: 'ILIKE', neq: '!=', gt: '>', gte: '>=', lte: '<=', lt: '<', is: 'IS' }[op] || '=';
          params.push(val === 'null' ? null : val);
          return `"${col}" ${pgOp} $${idx++}`;
        }).filter(Boolean);
        return orParts.length ? `(${orParts.join(' OR ')})` : null;
      }
      if (c.op === 'IN') {
        const placeholders = c.val.map(() => `$${idx++}`).join(', ');
        params.push(...c.val);
        return `"${c.col}" IN (${placeholders})`;
      }
      if (c.op === 'IS') {
        return `"${c.col}" IS ${c.val === null ? 'NULL' : 'NOT NULL'}`;
      }
      params.push(c.val);
      return `"${c.col}" ${c.op} $${idx++}`;
    }).filter(Boolean);
    return { where: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
  }

  async _execute() {
    const { where, params } = this._buildWhere();

    try {
      if (this._insert) {
        const rows = this._insert;
        const keys = Object.keys(rows[0]);
        const cols = keys.map(k => `"${k}"`).join(', ');
        let idx = 1;
        const valRows = rows.map(row => `(${keys.map(() => `$${idx++}`).join(', ')})`).join(', ');
        const vals = rows.flatMap(row => keys.map(k => row[k]));
        const sql = `INSERT INTO "${this.table}" (${cols}) VALUES ${valRows} RETURNING *`;
        const result = await this.pool.query(sql, vals);
        if (this._single) return { data: result.rows[0] || null, error: null };
        return { data: result.rows, error: null };
      }

      if (this._upsert) {
        const rows = this._upsert;
        const keys = Object.keys(rows[0]);
        const cols = keys.map(k => `"${k}"`).join(', ');
        let idx = 1;
        const valRows = rows.map(row => `(${keys.map(() => `$${idx++}`).join(', ')})`).join(', ');
        const vals = rows.flatMap(row => keys.map(k => row[k]));
        const conflict = this._upsertConflict ? `ON CONFLICT (${this._upsertConflict}) DO UPDATE SET ${keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ')}` : 'ON CONFLICT DO NOTHING';
        const sql = `INSERT INTO "${this.table}" (${cols}) VALUES ${valRows} ${conflict} RETURNING *`;
        const result = await this.pool.query(sql, vals);
        return { data: result.rows, error: null };
      }

      if (this._update) {
        const keys = Object.keys(this._update);
        let idx = 1;
        const sets = keys.map(k => `"${k}" = $${idx++}`).join(', ');
        const vals = keys.map(k => this._update[k]);
        const adjustedWhere = where.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + keys.length}`);
        const adjustedParams = params.map((_, i) => params[i]);
        const sql = `UPDATE "${this.table}" SET ${sets} ${adjustedWhere} RETURNING *`;
        const result = await this.pool.query(sql, [...vals, ...adjustedParams]);
        return { data: result.rows, error: null };
      }

      if (this._delete) {
        const sql = `DELETE FROM "${this.table}" ${where} RETURNING *`;
        const result = await this.pool.query(sql, params);
        return { data: result.rows, error: null };
      }

      // SELECT
      if (this._countOnly || this._head) {
        const sql = `SELECT COUNT(*) FROM "${this.table}" ${where}`;
        const result = await this.pool.query(sql, params);
        return { count: parseInt(result.rows[0].count), data: null, error: null };
      }

      let sql = `SELECT ${this._select} FROM "${this.table}" ${where}`;
      if (this._order) sql += ` ORDER BY ${this._order}`;
      if (this._limit) sql += ` LIMIT ${this._limit}`;

      const result = await this.pool.query(sql, params);
      if (this._single) {
        return { data: result.rows[0] || null, error: result.rows[0] ? null : { code: 'PGRST116', message: 'No rows found' } };
      }
      return { data: result.rows, error: null };
    } catch (e) {
      console.error(`[DB Error] ${this.table}:`, e.message);
      return { data: null, error: e, count: null };
    }
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }
}

module.exports = supabase;
