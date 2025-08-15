import dotenv from "dotenv";
dotenv.config();
// Import required modules
import express, { json } from "express";
import cors from "cors";
import connectDB from "./src/configs/dbconnect.js";
import router from "./src/routes/authRoutes.js";
import mediaRoutes from "./src/routes/mediaRoutes.js";
import errorhandler from "./src/middleware/errorhandler.js";
import profilePicRoutes from "./src/routes/profilePicRoutes.js";

// Create an Express application
const app = express();

// Enable CORS for all routes (allow requests from any origin)
app.use(cors());

// Logging middleware: logs method, URL, and timestamp for each API call
// Enhanced logging middleware: logs method, URL, timestamp, and response status
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const success = status >= 200 && status < 400 ? "SUCCESS" : "FAIL";
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${
        req.originalUrl
      } - ${status} (${success}) - ${duration}ms`
    );
  });
  next();
});

// Middleware to parse JSON request bodies
app.use(json());

// Connect to MongoDB database
connectDB();

// Mount authentication routes at /api/auth
app.use("/api/auth", router);

// Mount media routes at /api/media
app.use("/api/media", mediaRoutes);

// Mount profile picture routes at /api/profile-pic
app.use("/api/profile-pic", profilePicRoutes);

// Set the port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
// Error handler should be the last middleware
app.use(errorhandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
