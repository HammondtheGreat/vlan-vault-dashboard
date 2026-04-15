import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const bucket = req.params.bucket || "general";
    const dir = path.join("uploads", bucket);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/:bucket", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const publicUrl = `/uploads/${req.params.bucket}/${req.file.filename}`;
  res.json({ url: publicUrl });
});

router.delete("/:bucket/:filename", (req, res) => {
  const filepath = path.join("uploads", req.params.bucket, req.params.filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  res.json({ ok: true });
});

export default router;
