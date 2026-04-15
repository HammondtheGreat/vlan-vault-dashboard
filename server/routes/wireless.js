import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM wireless_networks ORDER BY sort_order");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { ssid, password, notes, is_hidden, sort_order } = req.body;
  const id = uuid();
  await pool.query(
    "INSERT INTO wireless_networks (id, ssid, password, notes, is_hidden, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    [id, ssid, password, notes, is_hidden ? 1 : 0, sort_order]
  );
  res.status(201).json({ id });
});

router.put("/:id", async (req, res) => {
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(req.body)) {
    if (k === "is_hidden") { sets.push(`${k} = ?`); vals.push(v ? 1 : 0); }
    else { sets.push(`${k} = ?`); vals.push(v); }
  }
  vals.push(req.params.id);
  await pool.query(`UPDATE wireless_networks SET ${sets.join(", ")} WHERE id = ?`, vals);
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM wireless_networks WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
