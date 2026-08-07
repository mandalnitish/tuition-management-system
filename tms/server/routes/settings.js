const router = require("express").Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(verifyToken);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: "Could not fetch settings.", error: err.message });
  }
});

router.put("/", upload.single("logo"), async (req, res) => {
  try {
    const { instituteName, phone, address, upiId } = req.body;
    const [existing] = await pool.query("SELECT * FROM settings WHERE id = 1");
    const logo = req.file ? `/uploads/${req.file.filename}` : existing[0]?.logo || null;

    await pool.query(
      `INSERT INTO settings (id, institute_name, phone, address, upi_id, logo) VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE institute_name=VALUES(institute_name), phone=VALUES(phone),
       address=VALUES(address), upi_id=VALUES(upi_id), logo=VALUES(logo)`,
      [instituteName, phone, address, upiId, logo]
    );
    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Could not update settings.", error: err.message });
  }
});

module.exports = router;
