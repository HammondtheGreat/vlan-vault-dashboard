import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.created_at, p.display_name 
     FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.created_at`
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  try {
    const { email, password, display_name } = req.body;
    const id = uuid();
    const hash = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)", [id, email, hash]);
    await pool.query("INSERT INTO profiles (id, user_id, display_name) VALUES (?, ?, ?)", [uuid(), id, display_name || email]);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { email, password, display_name } = req.body;
    if (email) await pool.query("UPDATE users SET email = ? WHERE id = ?", [email, req.params.id]);
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.params.id]);
    }
    if (display_name) await pool.query("UPDATE profiles SET display_name = ? WHERE user_id = ?", [display_name, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM profiles WHERE user_id = ?", [req.params.id]);
  await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
