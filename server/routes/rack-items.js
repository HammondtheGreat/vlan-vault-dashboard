import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";
import { safeSets } from "../columns.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rack_items ORDER BY start_u");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { device_id, start_u, u_size, label, notes } = req.body;
    const id = uuid();
    await pool.query(
      "INSERT INTO rack_items (id, device_id, start_u, u_size, label, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [id, device_id || null, start_u, u_size || 1, label || "", notes || ""]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = safeSets("rack_items", req.body);
    if (!result) return res.json({ ok: true });
    result.vals.push(req.params.id);
    await pool.query(`UPDATE rack_items SET ${result.sets.join(", ")} WHERE id = ?`, result.vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM rack_items WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
