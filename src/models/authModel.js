// Import mongoose for MongoDB object modeling
import mongoose from "mongoose";

// Define the schema for user authentication
const authSchema = new mongoose.Schema(
  {
    // Unique username for each user
    username: {
      type: String,
      required: true,
      unique: true,
    },
    // Hashed password for security
    password: {
      type: String,
      required: true,
    },
    // Unique email for each user
    email: {
      type: String,
      required: true,
      unique: true,
    },
    // User role: either consumer or creator
    role: {
      type: String,
      enum: ["consumer", "creator"],
      required: true,
      default: "consumer",
    },
    // Profile picture URL (Cloudinary)
    profilePic: {
      type: String,
      default: "",
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create the User model from the schema and export it
const User = mongoose.model("User", authSchema);
export default User;
