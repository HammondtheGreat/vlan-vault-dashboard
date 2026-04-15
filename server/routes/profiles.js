import { Router } from "express";
import pool from "../db.js";
import { safeSets } from "../columns.js";

const router = Router();

router.get("/me", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT display_name, avatar_url FROM profiles WHERE user_id = ?",
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/me", async (req, res) => {
  try {
    const result = safeSets("profiles", req.body);
    if (!result) return res.json({ ok: true });
    result.vals.push(req.user.id);
    await pool.query(`UPDATE profiles SET ${result.sets.join(", ")} WHERE user_id = ?`, result.vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
