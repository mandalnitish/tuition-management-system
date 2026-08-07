const router = require("express").Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/attendance?date=YYYY-MM-DD  or ?studentId=
router.get("/", async (req, res) => {
  try {
    const { date, studentId } = req.query;
    let sql = "SELECT * FROM attendance WHERE 1=1";
    const params = [];
    if (date) { sql += " AND date = ?"; params.push(date); }
    if (studentId) { sql += " AND student_id = ?"; params.push(studentId); }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch attendance.", error: err.message });
  }
});

// POST /api/attendance  { studentId, date, status }  — upserts
router.post("/", async (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    if (!studentId || !date || !status) {
      return res.status(400).json({ message: "Student, date and status are required." });
    }
    await pool.query(
      `INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [studentId, date, status]
    );
    res.json({ message: "Attendance saved." });
  } catch (err) {
    res.status(500).json({ message: "Could not save attendance.", error: err.message });
  }
});

module.exports = router;
