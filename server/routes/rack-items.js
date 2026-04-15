import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM rack_items ORDER BY start_u");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { device_id, start_u, u_size, label, notes } = req.body;
  const id = uuid();
  await pool.query(
    "INSERT INTO rack_items (id, device_id, start_u, u_size, label, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [id, device_id || null, start_u, u_size || 1, label, notes]
  );
  res.status(201).json({ id });
});

router.put("/:id", async (req, res) => {
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(req.body)) { sets.push(`${k} = ?`); vals.push(v); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  await pool.query(`UPDATE rack_items SET ${sets.join(", ")} WHERE id = ?`, vals);
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM rack_items WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
