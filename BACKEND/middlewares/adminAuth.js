// middlewares/adminAuth.js
const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  // Accept Bearer OR raw token headers (like your feedback routes)
  const rawTokenHeader = req.headers.token || req.headers["x-auth-token"];

  let token = null;
  if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
  else if (rawTokenHeader) token = rawTokenHeader;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // pass if explicitly admin…
    const isAdminFlag = decoded?.isAdmin === true;
    // …or if the token belongs to the configured admin email (compat with older tokens)
    const isConfiguredAdmin = decoded?.email && decoded.email === process.env.ADMIN_EMAIL;

    if (!isAdminFlag && !isConfiguredAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Not an admin" });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized: Token invalid or expired" });
  }
};

module.exports = adminAuth;