const router = require("express").Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// GET /api/reports/daily?date=YYYY-MM-DD
router.get("/daily", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const [payments] = await pool.query(
      `SELECT p.*, s.name AS student_name FROM fee_payments p JOIN students s ON s.id = p.student_id
       WHERE p.payment_date = ? ORDER BY p.id DESC`, [date]
    );
    const [expenses] = await pool.query("SELECT * FROM expenses WHERE date = ?", [date]);
    res.json({ date, payments, expenses });
  } catch (err) {
    res.status(500).json({ message: "Could not build daily report.", error: err.message });
  }
});

// GET /api/reports/monthly?month=March&year=2026
router.get("/monthly", async (req, res) => {
  try {
    const { month, year } = req.query;
    const [payments] = await pool.query(
      `SELECT p.*, s.name AS student_name FROM fee_payments p JOIN students s ON s.id = p.student_id
       WHERE p.month = ? AND p.year = ? ORDER BY p.payment_date DESC`, [month, year]
    );
    const monthIndex = MONTHS.indexOf(month) + 1;
    const prefix = `${year}-${String(monthIndex).padStart(2, "0")}`;
    const [expenses] = await pool.query("SELECT * FROM expenses WHERE DATE_FORMAT(date,'%Y-%m') = ?", [prefix]);
    const collection = payments.reduce((s, p) => s + Number(p.amount), 0);
    const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
    res.json({ month, year, payments, expenses, collection, expenseTotal, net: collection - expenseTotal });
  } catch (err) {
    res.status(500).json({ message: "Could not build monthly report.", error: err.message });
  }
});

// GET /api/reports/yearly?year=2026
router.get("/yearly", async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const [rows] = await pool.query("SELECT month, SUM(amount) AS amount FROM fee_payments WHERE year = ? GROUP BY month", [year]);
    const map = Object.fromEntries(rows.map(r => [r.month, Number(r.amount)]));
    const data = MONTHS.map(m => ({ month: m, amount: map[m] || 0 }));
    res.json({ year, data, total: data.reduce((s, d) => s + d.amount, 0) });
  } catch (err) {
    res.status(500).json({ message: "Could not build yearly report.", error: err.message });
  }
});

// GET /api/reports/student/:id
router.get("/student/:id", async (req, res) => {
  try {
    const [[student]] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (!student) return res.status(404).json({ message: "Student not found." });
    const [payments] = await pool.query("SELECT * FROM fee_payments WHERE student_id = ? ORDER BY year DESC, id DESC", [req.params.id]);
    const [attendanceRows] = await pool.query("SELECT status, COUNT(*) AS cnt FROM attendance WHERE student_id = ? GROUP BY status", [req.params.id]);
    const attendance = { Present: 0, Absent: 0, Leave: 0 };
    attendanceRows.forEach(r => { attendance[r.status] = r.cnt; });
    res.json({ student, payments, attendance, totalPaid: payments.reduce((s, p) => s + Number(p.amount), 0) });
  } catch (err) {
    res.status(500).json({ message: "Could not build student report.", error: err.message });
  }
});

// GET /api/reports/pending
router.get("/pending", async (req, res) => {
  try {
    const month = MONTHS[new Date().getMonth()];
    const year = new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.class, s.mobile, s.monthly_fee FROM students s
       WHERE s.status = 'Active' AND s.id NOT IN (
         SELECT student_id FROM fee_payments WHERE month = ? AND year = ?
       ) ORDER BY s.name`,
      [month, year]
    );
    res.json({ month, year, students: rows, totalDue: rows.reduce((s, r) => s + Number(r.monthly_fee), 0) });
  } catch (err) {
    res.status(500).json({ message: "Could not build pending report.", error: err.message });
  }
});

// GET /api/reports/search?q=
router.get("/search", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;
    const [rows] = await pool.query(
      `SELECT p.*, s.name AS student_name, s.class AS student_class, s.mobile AS student_mobile
       FROM fee_payments p JOIN students s ON s.id = p.student_id
       WHERE s.name LIKE ? OR s.class LIKE ? OR s.mobile LIKE ? OR p.receipt_no LIKE ? OR p.month LIKE ?
       ORDER BY p.payment_date DESC LIMIT 200`,
      [q, q, q, q, q]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Search failed.", error: err.message });
  }
});

module.exports = router;
