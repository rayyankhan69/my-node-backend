// Import the jsonwebtoken library for verifying JWT tokens
import jwt from "jsonwebtoken";
import User from "../models/authModel.js";

// Middleware to validate JWT token from the Authorization header
const validateToken = async (req, res, next) => {
  let token;
  let authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401);
      return next(new Error("Not authorized, no token"));
    }

    try {
      // Use JWT_SECRET to match login token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Fetch user from DB using decoded.id
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401);
        return next(new Error("Not authorized, user not found"));
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(401);
      return next(new Error("Not authorized, token failed"));
    }
  } else {
    res.status(401);
    return next(new Error("Not authorized, no token"));
  }
};

// Export the middleware as default for use in routes
export default validateToken;
