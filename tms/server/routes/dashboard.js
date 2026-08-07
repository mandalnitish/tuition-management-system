const router = require("express").Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// GET /api/dashboard?year=2026
router.get("/", async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const monthName = MONTHS[new Date().getMonth()];
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthPrefix = new Date().toISOString().slice(0, 7);

    const [[{ activeCount }]] = await pool.query("SELECT COUNT(*) AS activeCount FROM students WHERE status='Active'");
    const [[{ totalCount }]] = await pool.query("SELECT COUNT(*) AS totalCount FROM students");
    const [[{ totalCollection }]] = await pool.query("SELECT COALESCE(SUM(amount),0) AS totalCollection FROM fee_payments");
    const [[{ todayCollection }]] = await pool.query("SELECT COALESCE(SUM(amount),0) AS todayCollection FROM fee_payments WHERE payment_date = ?", [todayStr]);
    const [[{ newAdmissions }]] = await pool.query("SELECT COUNT(*) AS newAdmissions FROM students WHERE DATE_FORMAT(admission_date, '%Y-%m') = ?", [thisMonthPrefix]);

    const [pendingStudents] = await pool.query(
      `SELECT s.id, s.name, s.class, s.mobile, s.monthly_fee FROM students s
       WHERE s.status = 'Active' AND s.id NOT IN (
         SELECT student_id FROM fee_payments WHERE month = ? AND year = ?
       )`,
      [monthName, new Date().getFullYear()]
    );
    const pendingAmount = pendingStudents.reduce((s, r) => s + Number(r.monthly_fee), 0);

    const [monthlyRows] = await pool.query(
      "SELECT month, SUM(amount) AS amount FROM fee_payments WHERE year = ? GROUP BY month",
      [year]
    );
    const monthlyMap = Object.fromEntries(monthlyRows.map(r => [r.month, Number(r.amount)]));
    const monthlyCollection = MONTHS.map(m => ({ month: m.slice(0, 3), amount: monthlyMap[m] || 0 }));

    const [recentPayments] = await pool.query(
      `SELECT p.*, s.name AS student_name FROM fee_payments p JOIN students s ON s.id = p.student_id
       ORDER BY p.payment_date DESC, p.id DESC LIMIT 30`
    );

    // Student growth over the last 12 months
    const [allStudents] = await pool.query("SELECT admission_date FROM students");
    const growth = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = allStudents.filter(s => new Date(s.admission_date) <= endOfMonth).length;
      growth.push({ month: `${MONTHS[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}`, students: count });
    }

    res.json({
      activeStudents: activeCount,
      totalStudents: totalCount,
      totalCollection: Number(totalCollection),
      todayCollection: Number(todayCollection),
      pendingAmount,
      pendingCount: pendingStudents.length,
      pendingStudents,
      newAdmissions,
      monthlyCollection,
      recentPayments,
      studentGrowth: growth,
      monthName,
      year,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load dashboard.", error: err.message });
  }
});

module.exports = router;