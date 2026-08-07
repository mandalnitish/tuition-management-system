const router = require("express").Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM expenses ORDER BY date DESC, id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch expenses.", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, amount, date, category } = req.body;
    if (!title || !amount || !date) {
      return res.status(400).json({ message: "Title, amount and date are required." });
    }
    const [result] = await pool.query(
      "INSERT INTO expenses (title, amount, date, category) VALUES (?, ?, ?, ?)",
      [title, amount, date, category || "Other"]
    );
    const [rows] = await pool.query("SELECT * FROM expenses WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Could not create expense.", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM expenses WHERE id = ?", [req.params.id]);
    res.json({ message: "Expense deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete expense.", error: err.message });
  }
});

module.exports = router;
