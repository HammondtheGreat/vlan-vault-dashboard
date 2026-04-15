import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";
import { safeSets } from "../columns.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pdu_outlets ORDER BY outlet_number");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { outlet_number, device_name, notes } = req.body;
    const id = uuid();
    await pool.query(
      "INSERT INTO pdu_outlets (id, outlet_number, device_name, notes) VALUES (?, ?, ?, ?)",
      [id, outlet_number, device_name || "", notes || ""]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = safeSets("pdu_outlets", req.body);
    if (!result) return res.json({ ok: true });
    result.vals.push(req.params.id);
    await pool.query(`UPDATE pdu_outlets SET ${result.sets.join(", ")} WHERE id = ?`, result.vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM pdu_outlets WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
