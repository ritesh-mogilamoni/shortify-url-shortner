import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "url_shortener_secret_key_987654321";

export const authMiddleware = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback to Authorization Header (useful for API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("JWT Auth Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
