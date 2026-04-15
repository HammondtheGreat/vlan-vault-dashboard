import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM vlans ORDER BY vlan_id");
  res.json(rows);
});

router.post("/", async (req, res) => {
  try {
    const { vlan_id, name, subnet, color, icon } = req.body;
    const id = uuid();
    await pool.query(
      "INSERT INTO vlans (id, vlan_id, name, subnet, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
      [id, vlan_id, name, subnet, color, icon || "network"]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:vlanId", async (req, res) => {
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(req.body)) {
    sets.push(`${k} = ?`);
    vals.push(v);
  }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.vlanId);
  await pool.query(`UPDATE vlans SET ${sets.join(", ")} WHERE vlan_id = ?`, vals);
  res.json({ ok: true });
});

router.delete("/:vlanId", async (req, res) => {
  await pool.query("DELETE FROM vlans WHERE vlan_id = ?", [req.params.vlanId]);
  res.json({ ok: true });
});

// Bulk operations
router.delete("/", async (_req, res) => {
  await pool.query("DELETE FROM vlans");
  res.json({ ok: true });
});

router.post("/bulk", async (req, res) => {
  const rows = req.body;
  for (const r of rows) {
    const id = uuid();
    await pool.query(
      "INSERT INTO vlans (id, vlan_id, name, subnet, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
      [id, r.vlan_id, r.name, r.subnet, r.color, r.icon || "network"]
    );
  }
  res.status(201).json({ ok: true });
});

export default router;
