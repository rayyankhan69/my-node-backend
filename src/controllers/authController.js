// Import the User model for database operations
import User from "../models/authModel.js";
// Import bcryptjs for password hashing and comparison
import bcrypt from "bcryptjs";
// Import jsonwebtoken for JWT operations
import jwt from "jsonwebtoken";
// Import mongoose for ObjectId validation
import mongoose from "mongoose";
// Import constants for response status codes
import { constants } from "../constants.js";
// Import asyncHandler for handling asynchronous route handlers
import asyncHandler from "express-async-handler";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export const register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;

  // Regex to validate username: only lowercase letters, numbers, and underscores
  const usernameRegex = /^[a-z0-9_]+$/;
  // Regex to validate email format
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // Validate username
  if (!usernameRegex.test(username)) {
    res.status(constants.VALIDATION_ERROR);
    return next({
      name: "ValidationError",
      message:
        "Username must contain only lowercase letters, numbers, and underscores (no uppercase allowed).",
    });
  }
  // Validate email
  if (!emailRegex.test(email)) {
    res.status(constants.VALIDATION_ERROR);
    return next({
      name: "ValidationError",
      message: "Invalid email format.",
    });
  }

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      res.status(constants.VALIDATION_ERROR);
      return next({
        name: "ValidationError",
        message: "User already exists",
      });
    }
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user document
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || undefined,
    });
    await newUser.save();
    // Respond with success message
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(constants.INTERNAL_SERVER_ERROR);
    next({
      name: "ServerError",
      message: error.message || "Server error",
    });
  }
});

/**
 * Login a user with username or email and password
 * @route POST /api/auth/login
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export const login = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: username || null }, { email: email || null }],
    });
    if (!user) {
      res.status(constants.UNAUTHORIZED);
      return next({
        name: "UnauthorizedError",
        message: "Invalid credentials",
      });
    }
    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(constants.UNAUTHORIZED);
      return next({
        name: "UnauthorizedError",
        message: "Invalid credentials",
      });
    }
    // Generate a JWT token for the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // Respond with the token and user info (excluding password)
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(constants.INTERNAL_SERVER_ERROR);
    next({
      name: "ServerError",
      message: error.message || "Server error",
    });
  }
});

/** * Get any user's profile and their uploaded media
 * @route GET /api/auth/profile/:id
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void}
 */
// Get any user's profile and their uploaded media

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  const user = await User.findById(userId).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  let media = await Media.find({ uploader: userId });
  media = media.map((m) => ({
    ...m.toObject(),
    commentsCount: m.comments.length,
    ratingsCount: m.ratings.length,
  }));
  res.json({
    user: {
      ...user.toObject(),
      profilePic: user.profilePic || "",
    },
    media,
  });
});

/**
 * Get the currently authenticated user (requires authentication middleware)
 * @route GET /api/auth/current
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void}
 */
import Media from "../models/media_uploadModel.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
  // Always include uploaded media and profilePic for the logged-in user
  let userData = req.user.toObject();
  let media = await Media.find({ uploader: req.user._id });
  media = media.map((m) => ({
    ...m.toObject(),
    commentsCount: m.comments.length,
    ratingsCount: m.ratings.length,
  }));
  userData.media = media;
  userData.profilePic = req.user.profilePic || "";
  res.json(userData);
});
