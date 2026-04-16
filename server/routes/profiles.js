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
    // Ensure profile row exists (upsert)
    const { display_name, avatar_url } = req.body;
    await pool.query(
      `INSERT INTO profiles (id, user_id, display_name, avatar_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         display_name = COALESCE(VALUES(display_name), display_name),
         avatar_url = COALESCE(VALUES(avatar_url), avatar_url)`,
      [
        require("uuid").v4 ? undefined : undefined, // placeholder
        req.user.id,
        display_name || null,
        avatar_url || null,
      ]
    );
    // Simpler: just do the upsert properly
    // First check if exists
    const [existing] = await pool.query("SELECT id FROM profiles WHERE user_id = ?", [req.user.id]);
    if (existing.length === 0) {
      const { v4: uuidv4 } = await import("uuid");
      await pool.query(
        "INSERT INTO profiles (id, user_id, display_name, avatar_url) VALUES (?, ?, ?, ?)",
        [uuidv4(), req.user.id, display_name || null, avatar_url || null]
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
