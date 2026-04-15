import express from "express";
import cors from "cors";
import { authMiddleware } from "./auth.js";
import authRoutes from "./routes/auth.js";
import vlansRoutes from "./routes/vlans.js";
import devicesRoutes from "./routes/devices.js";
import rackItemsRoutes from "./routes/rack-items.js";
import cableDropsRoutes from "./routes/cable-drops.js";
import pduOutletsRoutes from "./routes/pdu-outlets.js";
import wirelessRoutes from "./routes/wireless.js";
import settingsRoutes from "./routes/settings.js";
import profilesRoutes from "./routes/profiles.js";
import auditRoutes from "./routes/audit.js";
import usersRoutes from "./routes/users.js";
import storageRoutes from "./routes/storage.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Public uploads directory
app.use("/uploads", express.static("uploads"));

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/vlans", authMiddleware, vlansRoutes);
app.use("/api/devices", authMiddleware, devicesRoutes);
app.use("/api/rack-items", authMiddleware, rackItemsRoutes);
app.use("/api/cable-drops", authMiddleware, cableDropsRoutes);
app.use("/api/pdu-outlets", authMiddleware, pduOutletsRoutes);
app.use("/api/wireless-networks", authMiddleware, wirelessRoutes);
app.use("/api/settings", authMiddleware, settingsRoutes);
app.use("/api/profiles", authMiddleware, profilesRoutes);
app.use("/api/audit", authMiddleware, auditRoutes);
app.use("/api/users", authMiddleware, usersRoutes);
app.use("/api/storage", authMiddleware, storageRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Global error handler — prevents crashes from unhandled route errors
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
