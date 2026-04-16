import { Router } from "express";
import { v4 as uuid } from "uuid";
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
    // Check if profile exists; create if not
    const [existing] = await pool.query("SELECT id FROM profiles WHERE user_id = ?", [req.user.id]);
    if (existing.length === 0) {
      await pool.query(
        "INSERT INTO profiles (id, user_id, display_name, avatar_url) VALUES (?, ?, ?, ?)",
        [uuid(), req.user.id, req.body.display_name || null, req.body.avatar_url || null]
      );
    } else {
      const result = safeSets("profiles", req.body);
      if (!result) return res.json({ ok: true });
      result.vals.push(req.user.id);
      await pool.query(`UPDATE profiles SET ${result.sets.join(", ")} WHERE user_id = ?`, result.vals);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
