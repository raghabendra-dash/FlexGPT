import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = req.headers.authorization;

  // 1. Check if token exists
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  // 2. Extract token if it has Bearer prefix
  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    // 5. Attach user to request
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};
