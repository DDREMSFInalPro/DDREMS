/**
 * Seed Admin User
 * Creates an admin account in the shared DDREMS database
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'PropertyAdmin', 'backend', '.env') });
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ddrems',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  { host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 5432, dialect: 'postgres', logging: false }
);

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.ENUM('owner', 'buyer', 'admin'), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'users', timestamps: true, underscored: true });

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const existing = await User.findOne({ where: { email: 'admin@ddrems.com' } });
    if (existing) {
      console.log('Admin user already exists:', existing.email);
    } else {
      const hash = await bcrypt.hash('admin123', 12);
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@ddrems.com',
        passwordHash: hash,
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@ddrems.com');
      console.log('   Password: admin123');
    }

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
