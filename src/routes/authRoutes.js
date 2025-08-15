import express from "express";
import {
  register,
  login,
  getCurrentUser,
  getProfile,
} from "../controllers/authController.js";
import validateToken from "../middleware/authMiddleware.js";

const router = express.Router();

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Get any user's profile and their uploaded media
router.get("/profile/:id", getProfile);

router.get("/current", validateToken, getCurrentUser);

export default router;
