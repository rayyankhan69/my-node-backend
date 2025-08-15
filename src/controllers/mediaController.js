import asyncHandler from "express-async-handler";
import cloudinary from "cloudinary";
import multer from "multer";
import Media from "../models/media_uploadModel.js";

// Search media by title
export const searchMedia = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  // Create a case-insensitive regex pattern for the search
  const searchPattern = new RegExp(query, "i");

  let mediaList = await Media.find({ title: searchPattern })
    .populate("uploader", "username profilePic")
    .populate("comments.user", "username")
    .populate("ratings.user", "username");

  mediaList = mediaList.map((m) => {
    const avgRating =
      m.ratings.length > 0
        ? m.ratings.reduce((a, b) => a + b.value, 0) / m.ratings.length
        : null;
    const comments = m.comments.map((c) => ({
      username: c.user?.username || "",
      text: c.text,
      createdAt: c.createdAt,
    }));
    const ratings = m.ratings.map((r) => ({
      username: r.user?.username || "",
      value: r.value,
    }));
    return {
      _id: m._id,
      title: m.title,
      caption: m.caption,
      ageRating: m.ageRating,
      thumbnail: m.thumbnail,
      video: m.video,
      uploader: {
        username: m.uploader?.username || "",
        profilePic: m.uploader?.profilePic || "",
      },
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      comments,
      ratings,
      commentsCount: comments.length,
      ratingsCount: ratings.length,
      avgRating,
      views: m.views,
    };
  });
  res.json(mediaList);
});

// Get all media with uploader username, comments, ratings, counts, caption, ageRating, etc.
export const getAllMedia = asyncHandler(async (req, res) => {
  let mediaList = await Media.find()
    .populate("uploader", "username profilePic")
    .populate("comments.user", "username")
    .populate("ratings.user", "username");
  mediaList = mediaList.map((m) => {
    const avgRating =
      m.ratings.length > 0
        ? m.ratings.reduce((a, b) => a + b.value, 0) / m.ratings.length
        : null;
    const comments = m.comments.map((c) => ({
      username: c.user?.username || "",
      text: c.text,
      createdAt: c.createdAt,
    }));
    const ratings = m.ratings.map((r) => ({
      username: r.user?.username || "",
      value: r.value,
    }));
    return {
      _id: m._id,
      title: m.title,
      caption: m.caption,
      ageRating: m.ageRating,
      thumbnail: m.thumbnail,
      video: m.video,
      uploader: {
        username: m.uploader?.username || "",
        profilePic: m.uploader?.profilePic || "",
      },
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      comments,
      ratings,
      commentsCount: comments.length,
      ratingsCount: ratings.length,
      avgRating,
      views: m.views,
    };
  });
  res.json(mediaList);
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for form-data file uploads
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload media (video + thumbnail)
export const uploadMedia = asyncHandler(async (req, res) => {
  const { title, caption, ageRating } = req.body;
  const uploader = req.user._id;

  // Only allow creators to upload
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Only creators can upload media" });
  }

  if (!req.files || !req.files.video || !req.files.thumbnail) {
    return res
      .status(400)
      .json({ message: "Video and thumbnail are required" });
  }

  // Create a new media doc to get the media id for folder structure
  // Create a new media doc to get the media id for folder structure
  const tempMedia = new Media({
    title,
    caption,
    ageRating,
    uploader,
    thumbnail: "", // temp
    video: "", // temp
  });
  const folderPath = `tiktokclone/${uploader}/${tempMedia._id}`;

  // Upload thumbnail to cloudinary
  cloudinary.v2.uploader
    .upload_stream(
      {
        folder: folderPath,
        resource_type: "image",
      },
      (error, result) => {
        if (error)
          return res
            .status(500)
            .json({ message: "Thumbnail upload failed", error });
        tempMedia.thumbnail = result.secure_url;

        // Upload video to cloudinary
        cloudinary.v2.uploader
          .upload_stream(
            {
              folder: folderPath,
              resource_type: "video",
            },
            async (error2, result2) => {
              if (error2)
                return res
                  .status(500)
                  .json({ message: "Video upload failed", error: error2 });
              tempMedia.video = result2.secure_url;
              try {
                await tempMedia.validate();
                await tempMedia.save();
                res.status(201).json(tempMedia);
              } catch (validationError) {
                res.status(400).json({
                  error: "ValidationError",
                  message: validationError.message,
                });
              }
            }
          )
          .end(req.files.video[0].buffer);
      }
    )
    .end(req.files.thumbnail[0].buffer);
});

// Get media by ID (with comments, ratings, and views)
export const getMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id)
    .populate("uploader", "username email")
    .populate("comments.user", "username");
  if (!media) return res.status(404).json({ message: "Media not found" });
  // Calculate average rating
  const avgRating =
    media.ratings.length > 0
      ? media.ratings.reduce((a, b) => a + b.value, 0) / media.ratings.length
      : null;
  const commentsCount = media.comments.length;
  const ratingsCount = media.ratings.length;
  res.json({ ...media.toObject(), avgRating, commentsCount, ratingsCount });
});

// Add comment to media
export const addComment = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: "Media not found" });
  media.comments.push({ user: req.user._id, text: req.body.text });
  await media.save();
  res.status(201).json(media.comments);
});

// Add rating to media
export const addRating = asyncHandler(async (req, res) => {
  const { value } = req.body;
  if (value < 1 || value > 10) {
    return res.status(400).json({ message: "Rating must be 1-10" });
  }
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: "Media not found" });
  // Remove previous rating by this user
  media.ratings = media.ratings.filter(
    (r) => r.user.toString() !== req.user._id.toString()
  );
  media.ratings.push({ user: req.user._id, value });
  await media.save();
  res.status(201).json(media.ratings);
});

// Increment view count
export const incrementView = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: "Media not found" });
  media.views += 1;
  await media.save();
  res.json({ views: media.views });
});
