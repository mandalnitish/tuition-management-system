const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("========== LOGIN ==========");
    console.log("Username:", username);

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    console.log("Users found:", rows.length);

    if (!rows.length) {
      console.log("❌ User not found");
      return res.status(401).json({
        message: "Incorrect username or password."
      });
    }

    const user = rows[0];

    console.log("Database user:", user.username);

    const match = await bcrypt.compare(password, user.password);

    console.log("Password match:", match);

    if (!match) {
      console.log("❌ Password incorrect");
      return res.status(401).json({
        message: "Incorrect username or password."
      });
    }

    console.log("✅ Login successful");

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      message: "Login failed.",
      error: err.message,
    });
  }
});

// POST /api/auth/change-password
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: "New password must be at least 4 characters." });
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];
    const match = await bcrypt.compare(currentPassword || "", user.password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect." });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Could not update password.", error: err.message });
  }
});

module.exports = router;
