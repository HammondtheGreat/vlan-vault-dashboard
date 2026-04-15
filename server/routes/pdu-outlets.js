import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM pdu_outlets ORDER BY outlet_number");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { outlet_number, device_name, notes } = req.body;
  const id = uuid();
  await pool.query(
    "INSERT INTO pdu_outlets (id, outlet_number, device_name, notes) VALUES (?, ?, ?, ?)",
    [id, outlet_number, device_name, notes]
  );
  res.status(201).json({ id });
});

router.put("/:id", async (req, res) => {
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(req.body)) { sets.push(`${k} = ?`); vals.push(v); }
  vals.push(req.params.id);
  await pool.query(`UPDATE pdu_outlets SET ${sets.join(", ")} WHERE id = ?`, vals);
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM pdu_outlets WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
