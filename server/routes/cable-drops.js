import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";
import { safeSets } from "../columns.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM cable_drops ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { label, location, category, switch_model, switch_port, notes, sort_order } = req.body;
    const id = uuid();
    await pool.query(
      "INSERT INTO cable_drops (id, label, location, category, switch_model, switch_port, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, label || "", location || "", category || "", switch_model || "", switch_port || "", notes || "", sort_order || 0]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = safeSets("cable_drops", req.body);
    if (!result) return res.json({ ok: true });
    result.vals.push(req.params.id);
    await pool.query(`UPDATE cable_drops SET ${result.sets.join(", ")} WHERE id = ?`, result.vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM cable_drops WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
