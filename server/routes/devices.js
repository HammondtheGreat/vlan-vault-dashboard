import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const order = req.query.order === "name" ? "device_name" : "ip_address";
  const [rows] = await pool.query(`SELECT * FROM devices ORDER BY ${order}`);
  res.json(rows);
});

router.post("/", async (req, res) => {
  try {
    const { vlan_id, ip_address, device_name, brand, model, docs, location, notes, status } = req.body;
    const id = uuid();
    await pool.query(
      `INSERT INTO devices (id, vlan_id, ip_address, device_name, brand, model, docs, location, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, vlan_id, ip_address, device_name, brand, model, docs, location, notes, status]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(req.body)) {
    sets.push(`${k} = ?`); vals.push(v);
  }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  await pool.query(`UPDATE devices SET ${sets.join(", ")} WHERE id = ?`, vals);
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM devices WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// Bulk by vlan
router.put("/by-vlan/:vlanId", async (req, res) => {
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(req.body)) {
    sets.push(`${k} = ?`); vals.push(v);
  }
  vals.push(req.params.vlanId);
  await pool.query(`UPDATE devices SET ${sets.join(", ")} WHERE vlan_id = ?`, vals);
  res.json({ ok: true });
});

router.delete("/", async (_req, res) => {
  await pool.query("DELETE FROM devices");
  res.json({ ok: true });
});

router.post("/bulk", async (req, res) => {
  for (const r of req.body) {
    const id = uuid();
    await pool.query(
      `INSERT INTO devices (id, vlan_id, ip_address, device_name, brand, model, docs, location, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, r.vlan_id, r.ip_address, r.device_name, r.brand, r.model, r.docs, r.location, r.notes, r.status]
    );
  }
  res.status(201).json({ ok: true });
});

export default router;
