const router = require("express").Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(verifyToken);

// GET /api/students?search=&status=
router.get("/", async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = "SELECT * FROM students WHERE 1=1";
    const params = [];
    if (search) {
      sql += " AND (name LIKE ? OR mobile LIKE ? OR class LIKE ? OR school LIKE ?)";
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY name ASC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch students.", error: err.message });
  }
});

// GET /api/students/:id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Student not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch student.", error: err.message });
  }
});

// POST /api/students  (multipart/form-data, field name: photo)
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.mobile || !b.class || !b.monthlyFee || !b.admissionDate) {
      return res.status(400).json({ message: "Name, mobile, class, admission date and monthly fee are required." });
    }
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO students (name, father_name, mother_name, mobile, address, class, school, admission_date, monthly_fee, status, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.name, b.fatherName || null, b.motherName || null, b.mobile, b.address || null, b.class, b.school || null,
       b.admissionDate, b.monthlyFee, b.status || "Active", photo]
    );
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Could not create student.", error: err.message });
  }
});

// PUT /api/students/:id
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const b = req.body;
    const [existingRows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (!existingRows.length) return res.status(404).json({ message: "Student not found." });
    const photo = req.file ? `/uploads/${req.file.filename}` : existingRows[0].photo;

    await pool.query(
      `UPDATE students SET name=?, father_name=?, mother_name=?, mobile=?, address=?, class=?, school=?,
       admission_date=?, monthly_fee=?, status=?, photo=? WHERE id=?`,
      [b.name, b.fatherName || null, b.motherName || null, b.mobile, b.address || null, b.class, b.school || null,
       b.admissionDate, b.monthlyFee, b.status || "Active", photo, req.params.id]
    );
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Could not update student.", error: err.message });
  }
});

// DELETE /api/students/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM students WHERE id = ?", [req.params.id]);
    res.json({ message: "Student deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete student.", error: err.message });
  }
});

module.exports = router;
