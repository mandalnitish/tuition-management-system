require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/db");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.get("/test-db", async (req, res) => {
  try {
    const [[students]] = await pool.query(
      "SELECT COUNT(*) AS total FROM students"
    );

    const [[payments]] = await pool.query(
      "SELECT COUNT(*) AS total FROM fee_payments"
    );

    res.json({
      students: students.total,
      payments: payments.total,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Tuition Management API running on http://localhost:${PORT}`));
