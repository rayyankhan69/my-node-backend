import express from "express";
import validateToken from "../middleware/authMiddleware.js";
import {
  uploadProfilePic,
  deleteProfilePic,
  uploadProfilePicMulter,
} from "../controllers/profilePicController.js";

const router = express.Router();

// Upload or update profile picture
router.post(
  "/upload",
  validateToken,
  uploadProfilePicMulter.single("profilePic"),
  uploadProfilePic
);

// Delete profile picture
router.delete("/delete", validateToken, deleteProfilePic);

export default router;
