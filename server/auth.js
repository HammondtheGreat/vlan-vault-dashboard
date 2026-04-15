import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "change-me-in-production";
const EXPIRES = "24h";

export function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
