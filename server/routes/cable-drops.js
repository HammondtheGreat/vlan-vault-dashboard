import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM cable_drops ORDER BY sort_order");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { label, location, category, switch_model, switch_port, notes, sort_order } = req.body;
  const id = uuid();
  await pool.query(
    "INSERT INTO cable_drops (id, label, location, category, switch_model, switch_port, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, label, location, category, switch_model, switch_port, notes, sort_order]
  );
  res.status(201).json({ id });
});

router.put("/:id", async (req, res) => {
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(req.body)) { sets.push(`${k} = ?`); vals.push(v); }
  vals.push(req.params.id);
  await pool.query(`UPDATE cable_drops SET ${sets.join(", ")} WHERE id = ?`, vals);
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM cable_drops WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
