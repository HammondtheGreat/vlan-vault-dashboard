import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";
import { safeSets } from "../columns.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM vlans ORDER BY vlan_id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { vlan_id, name, subnet, color, icon } = req.body;
    const id = uuid();
    await pool.query(
      "INSERT INTO vlans (id, vlan_id, name, subnet, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
      [id, vlan_id, name || "", subnet || "", color || "#3B82F6", icon || "network"]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:vlanId", async (req, res) => {
  try {
    const result = safeSets("vlans", req.body);
    if (!result) return res.json({ ok: true });
    result.vals.push(req.params.vlanId);
    await pool.query(`UPDATE vlans SET ${result.sets.join(", ")} WHERE vlan_id = ?`, result.vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:vlanId", async (req, res) => {
  try {
    await pool.query("DELETE FROM vlans WHERE vlan_id = ?", [req.params.vlanId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", async (_req, res) => {
  try {
    await pool.query("DELETE FROM vlans");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const rows = req.body;
    for (const r of rows) {
      const id = uuid();
      await pool.query(
        "INSERT INTO vlans (id, vlan_id, name, subnet, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
        [id, r.vlan_id, r.name || "", r.subnet || "", r.color || "#3B82F6", r.icon || "network"]
      );
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
