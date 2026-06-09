// backend/middleware/userAuth.js
const jwt = require("jsonwebtoken");

const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const rawToken = req.headers.token || req.headers["x-auth-token"];

  let token = null;
  if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
  else if (rawToken) token = rawToken;

  if (!token) return res.status(401).json({ success: false, message: "Unauthorized: No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
    req.user = { id: decoded.id };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};

module.exports = userAuth;