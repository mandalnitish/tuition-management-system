// Creates the default admin user (admin / admin123).
// Run with: npm run seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

(async () => {
  try {
    const username = "admin";
    const password = "admin123";
    const [existing] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existing.length) {
      console.log("Admin user already exists — skipping.");
      process.exit(0);
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')", [username, hash]);
    console.log("Created default admin user -> username: admin, password: admin123");
    console.log("Please change this password after your first login.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
})();
