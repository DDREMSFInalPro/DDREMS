/**
 * Seed Admin User
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./models');

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const existing = await User.findOne({ where: { email: 'admin@ddrems.com' } });
    if (existing) {
      console.log('Admin user already exists:', existing.email);
    } else {
      const hash = await bcrypt.hash('admin123', 12);
      await User.create({
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
