const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 5432
});

async function initDb() {
  console.log('🚀 Starting PostgreSQL Database Initialization...');
  
  try {
    // 1. Create Users Table
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        profile_image VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        profile_approved BOOLEAN DEFAULT FALSE,
        profile_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Profile Tables
    console.log('Creating profile tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255),
        phone_number VARCHAR(20),
        address TEXT,
        profile_photo TEXT,
        id_document TEXT,
        profile_status VARCHAR(50) DEFAULT 'pending',
        approved_by INT REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_profiles (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255),
        phone_number VARCHAR(20),
        address TEXT,
        profile_photo TEXT,
        id_document TEXT,
        business_license TEXT,
        profile_status VARCHAR(50) DEFAULT 'pending',
        approved_by INT REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS broker_profiles (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255),
        phone_number VARCHAR(20),
        address TEXT,
        profile_photo TEXT,
        id_document TEXT,
        broker_license TEXT,
        license_number VARCHAR(100),
        profile_status VARCHAR(50) DEFAULT 'pending',
        approved_by INT REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Brokers Table (Business Data)
    console.log('Creating brokers table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brokers (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        profile_image VARCHAR(255),
        license_number VARCHAR(100) UNIQUE,
        commission_rate DECIMAL(5,2) DEFAULT 2.5,
        total_sales INT DEFAULT 0,
        total_commission DECIMAL(15,2) DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Properties Table
    console.log('Creating properties table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(15,2) NOT NULL,
        location VARCHAR(255) NOT NULL,
        address VARCHAR(500),
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        type VARCHAR(50) NOT NULL,
        bedrooms INT,
        bathrooms INT,
        area DECIMAL(10,2),
        images TEXT,
        main_image TEXT,
        features JSONB,
        status VARCHAR(50) DEFAULT 'active',
        broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
        owner_id INT REFERENCES users(id) ON DELETE SET NULL,
        listing_date DATE,
        expiry_date DATE,
        verified BOOLEAN DEFAULT FALSE,
        verification_date TIMESTAMP,
        views INT DEFAULT 0,
        favorites INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Create Announcements Table
    console.log('Creating announcements table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        priority VARCHAR(50) DEFAULT 'normal',
        target_role VARCHAR(50) DEFAULT 'all',
        author_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Create Notifications Table
    console.log('Creating notifications table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        notification_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        link VARCHAR(500),
        action_url VARCHAR(255),
        related_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Create Messages Table
    console.log('Creating messages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
        property_id INT REFERENCES properties(id) ON DELETE SET NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'general',
        status VARCHAR(50) DEFAULT 'sent',
        is_read BOOLEAN DEFAULT FALSE,
        is_group BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Create Agreement Requests Table
    console.log('Creating agreement_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agreement_requests (
        id SERIAL PRIMARY KEY,
        property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        owner_id INT REFERENCES users(id) ON DELETE SET NULL,
        broker_id INT REFERENCES users(id) ON DELETE SET NULL,
        request_message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        response_message TEXT,
        responded_by INT REFERENCES users(id) ON DELETE SET NULL,
        responded_at TIMESTAMP,
        payment_confirmed BOOLEAN DEFAULT FALSE,
        payment_receipt_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Insert Admin User
    console.log('Inserting admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@ddrems.com']);
    
    if (adminCheck.rows.length === 0) {
      const res = await pool.query(
        'INSERT INTO users (name, email, password, role, profile_approved, profile_completed, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        ['System Administrator', 'admin@ddrems.com', hashedPassword, 'admin', true, true, 'active']
      );
      console.log('✅ Admin user created with ID:', res.rows[0].id);
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // 10. Insert Sample Data (Optional but helpful)
    // You can add more sample data here if needed

    console.log('\n✅ Database Initialization Complete! All required tables created.');
  } catch (err) {
    console.error('\n❌ Error during initialization:', err.message);
  } finally {
    await pool.end();
  }
}

initDb();
