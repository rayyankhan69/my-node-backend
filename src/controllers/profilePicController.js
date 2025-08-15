import User from "../models/authModel.js";
import asyncHandler from "express-async-handler";
import cloudinary from "cloudinary";
import multer from "multer";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
export const uploadProfilePicMulter = multer({ storage });

// Upload or update profile picture
export const uploadProfilePic = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const userId = req.user._id;
  const folderPath = `tiktokclone/${userId}/profile`;

  // If user already has a profile pic, delete it from Cloudinary
  if (req.user.profilePic) {
    const publicId = req.user.profilePic
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];
    try {
      await cloudinary.v2.uploader.destroy(publicId, {
        resource_type: "image",
      });
    } catch (e) {}
  }

  cloudinary.v2.uploader
    .upload_stream(
      {
        folder: folderPath,
        resource_type: "image",
        public_id: "profilePic",
        overwrite: true,
      },
      async (error, result) => {
        if (error)
          return res.status(500).json({ message: "Upload failed", error });
        req.user.profilePic = result.secure_url;
        await req.user.save();
        res.json({ profilePic: req.user.profilePic });
      }
    )
    .end(req.file.buffer);
});

// Delete profile picture
export const deleteProfilePic = asyncHandler(async (req, res) => {
  if (!req.user.profilePic) {
    return res.status(400).json({ message: "No profile picture to delete" });
  }
  const publicId = req.user.profilePic
    .split("/")
    .slice(-2)
    .join("/")
    .split(".")[0];
  await cloudinary.v2.uploader.destroy(publicId, { resource_type: "image" });
  req.user.profilePic = "";
  await req.user.save();
  res.json({ message: "Profile picture deleted" });
});
