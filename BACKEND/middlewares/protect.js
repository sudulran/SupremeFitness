import jwt from 'jsonwebtoken';
import User from "../models/userModel.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("protect: authHeader:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("protect: decoded:", decoded);

    const user = await User.findById(decoded.id).select("-password");
    console.log("protect: user from DB:", user);

    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("protect error:", error);
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

export default protect;
