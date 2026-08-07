const router = require("express").Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/payments?year=&studentId=&month=&date=
router.get("/", async (req, res) => {
  try {
    const { year, studentId, month, date } = req.query;
    let sql = `SELECT p.*, s.name AS student_name, s.class AS student_class, s.mobile AS student_mobile
                FROM fee_payments p JOIN students s ON s.id = p.student_id WHERE 1=1`;
    const params = [];
    if (year) { sql += " AND p.year = ?"; params.push(year); }
    if (studentId) { sql += " AND p.student_id = ?"; params.push(studentId); }
    if (month) { sql += " AND p.month = ?"; params.push(month); }
    if (date) { sql += " AND p.payment_date = ?"; params.push(date); }
    sql += " ORDER BY p.payment_date DESC, p.id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch payments.", error: err.message });
  }
});

// POST /api/payments
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { studentId, month, year, amount, paymentDate, paymentMode, remarks } = req.body;
    if (!studentId || !month || !year || !amount || !paymentDate) {
      conn.release();
      return res.status(400).json({ message: "Student, month, year, amount and payment date are required." });
    }

    await conn.beginTransaction();
    const [[{ cnt }]] = await conn.query("SELECT COUNT(*) AS cnt FROM fee_payments WHERE year = ?", [year]);
    const receiptNo = `${year}${String(cnt + 1).padStart(3, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO fee_payments (student_id, month, year, amount, payment_date, payment_mode, receipt_no, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, month, year, amount, paymentDate, paymentMode || "Cash", receiptNo, remarks || null]
    );
    await conn.commit();

    const [rows] = await pool.query(
      `SELECT p.*, s.name AS student_name, s.class AS student_class, s.mobile AS student_mobile
       FROM fee_payments p JOIN students s ON s.id = p.student_id WHERE p.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "A payment for this student and month already exists." });
    }
    res.status(500).json({ message: "Could not record payment.", error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/payments/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM fee_payments WHERE id = ?", [req.params.id]);
    res.json({ message: "Payment deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete payment.", error: err.message });
  }
});

module.exports = router;
