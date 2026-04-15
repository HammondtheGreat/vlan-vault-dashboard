import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import pool from "../db.js";
import { createToken, authMiddleware } from "../auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = createToken(user);
    res.json({ user: { id: user.id, email: user.email }, access_token: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (_req, res) => res.json({ ok: true }));

router.get("/session", authMiddleware, async (req, res) => {
  res.json({ user: req.user, access_token: req.headers.authorization.slice(7) });
});

router.put("/user", authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email) await pool.query("UPDATE users SET email = ? WHERE id = ?", [email, req.user.id]);
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.user.id]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
