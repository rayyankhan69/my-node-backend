import express from "express";
import {
  uploadMedia,
  getMedia,
  addComment,
  addRating,
  incrementView,
  upload,
  getAllMedia,
  searchMedia,
} from "../controllers/mediaController.js";

const router = express.Router();

// Upload media (protected, only for creators, with form-data)
router.post(
  "/upload",
  validateToken,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadMedia
);

// Get all media (protected, only for authenticated users)
import validateToken from "../middleware/authMiddleware.js";
router.get("/", validateToken, getAllMedia);

// Search media by title (protected, only for authenticated users)
router.get("/search", validateToken, searchMedia);

// Get media by ID (public)
router.get("/:id", getMedia);

// Add comment to media (protected)
router.post("/:id/comment", validateToken, addComment);

// Add rating to media (protected)
router.post("/:id/rate", validateToken, addRating);

// Increment view count (public, can be called when video is viewed)
router.post("/:id/view", incrementView);

export default router;
