/**
 * Seed Admin User
 * Creates the initial admin account.
 * Run: node scripts/seedAdmin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");
const UserModel = require("../models/User");

const User = UserModel(sequelize);

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    await sequelize.sync({ alter: false });

    const email = process.env.ADMIN_EMAIL || "admin@ddrems.com";
    const password = process.env.ADMIN_PASSWORD || "Admin@123";
    const name = process.env.ADMIN_NAME || "System Admin";

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`ℹ️  Admin already exists: ${email}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, email, passwordHash, role: "admin" });

    console.log("✅ Admin user created successfully!");
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log("   ⚠️  Change the password after first login!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
