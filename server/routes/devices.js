import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";
import { safeSets } from "../columns.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const order = req.query.order === "name" ? "device_name" : "ip_address";
    const [rows] = await pool.query(`SELECT * FROM devices ORDER BY ${order}`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { vlan_id, ip_address, device_name, brand, model, docs, docs_url, location, notes, status } = req.body;
    const id = uuid();
    await pool.query(
      `INSERT INTO devices (id, vlan_id, ip_address, device_name, brand, model, docs, docs_url, location, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, vlan_id, ip_address || "", device_name || "", brand || "", model || "", docs || "", docs_url || "", location || "", notes || "", status || "active"]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = safeSets("devices", req.body);
    if (!result) return res.json({ ok: true });
    result.vals.push(req.params.id);
    await pool.query(`UPDATE devices SET ${result.sets.join(", ")} WHERE id = ?`, result.vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM devices WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/by-vlan/:vlanId", async (req, res) => {
  try {
    const result = safeSets("devices", req.body);
    if (!result) return res.json({ ok: true });
    result.vals.push(req.params.vlanId);
    await pool.query(`UPDATE devices SET ${result.sets.join(", ")} WHERE vlan_id = ?`, result.vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", async (_req, res) => {
  try {
    await pool.query("DELETE FROM devices");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    for (const r of req.body) {
      const id = uuid();
      await pool.query(
        `INSERT INTO devices (id, vlan_id, ip_address, device_name, brand, model, docs, docs_url, location, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, r.vlan_id, r.ip_address || "", r.device_name || "", r.brand || "", r.model || "", r.docs || "", r.docs_url || "", r.location || "", r.notes || "", r.status || "active"]
      );
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
