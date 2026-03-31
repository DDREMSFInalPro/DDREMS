const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 5432
});

async function main() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('Tables in database:', res.rows.length);
    res.rows.forEach(r => console.log(' -', r.table_name));
    
    // Check if users table exists
    const usersCheck = res.rows.find(r => r.table_name === 'users');
    if (!usersCheck) {
      console.log('\n❌ "users" table does NOT exist!');
    } else {
      console.log('\n✅ "users" table exists');
      const users = await pool.query("SELECT id, name, email, role FROM users LIMIT 5");
      console.log('Sample users:', users.rows);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}
main();
