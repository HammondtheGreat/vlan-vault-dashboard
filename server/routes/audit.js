import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 500);
    const [rows] = await pool.query("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?", [limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { action, entity_type, entity_id, details, performed_by, performed_by_email } = req.body;
    const id = uuid();
    await pool.query(
      "INSERT INTO audit_log (id, action, entity_type, entity_id, details, performed_by, performed_by_email) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, action, entity_type, entity_id || null, JSON.stringify(details || null), performed_by || req.user.id, performed_by_email || req.user.email]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
