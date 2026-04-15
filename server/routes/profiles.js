import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/me", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT display_name, avatar_url FROM profiles WHERE user_id = ?",
    [req.user.id]
  );
  res.json(rows[0] || null);
});

router.put("/me", async (req, res) => {
  const { display_name, avatar_url } = req.body;
  const sets = [], vals = [];
  if (display_name !== undefined) { sets.push("display_name = ?"); vals.push(display_name); }
  if (avatar_url !== undefined) { sets.push("avatar_url = ?"); vals.push(avatar_url); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.user.id);
  await pool.query(`UPDATE profiles SET ${sets.join(", ")} WHERE user_id = ?`, vals);
  res.json({ ok: true });
});

export default router;
