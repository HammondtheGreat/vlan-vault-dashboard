import { Router } from "express";
import { v4 as uuid } from "uuid";
import pool from "../db.js";
import { safeSets } from "../columns.js";

const router = Router();

// App settings
router.get("/app", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM app_settings WHERE user_id = ?", [req.user.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/app", async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (id) {
      const result = safeSets("app_settings", updates);
      if (result) {
        result.sets.push("updated_at = NOW()");
        result.vals.push(id);
        await pool.query(`UPDATE app_settings SET ${result.sets.join(", ")} WHERE id = ?`, result.vals);
      }
    } else {
      const newId = uuid();
      await pool.query(
        "INSERT INTO app_settings (id, user_id, site_name, page_title, favicon_url) VALUES (?, ?, ?, ?, ?)",
        [newId, req.user.id, updates.site_name || "Warp9 IPAM", updates.page_title || "IPAM", updates.favicon_url || null]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SMTP settings
router.get("/smtp", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM smtp_settings WHERE user_id = ?", [req.user.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/smtp", async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (id) {
      const result = safeSets("smtp_settings", updates, {
        use_tls: (v) => (v ? 1 : 0),
      });
      if (result) {
        result.sets.push("updated_at = NOW()");
        result.vals.push(id);
        await pool.query(`UPDATE smtp_settings SET ${result.sets.join(", ")} WHERE id = ?`, result.vals);
      }
    } else {
      const newId = uuid();
      await pool.query(
        `INSERT INTO smtp_settings (id, user_id, smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name, use_tls) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, req.user.id, updates.smtp_host || "", updates.smtp_port || 587, updates.smtp_username || "",
         updates.smtp_password || "", updates.from_email || "", updates.from_name || "", updates.use_tls ? 1 : 0]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
