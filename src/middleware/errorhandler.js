// Import custom error code constants
import { constants } from "../constants.js";

// Custom error handler middleware for Express
const errorhandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  let response = {};
  switch (statusCode) {
    case constants.VALIDATION_ERROR:
      response = {
        error: "ValidationError",
        message: err.message,
      };
      break;
    case constants.UNAUTHORIZED:
      response = {
        error: "UnauthorizedError",
        message: err.message,
      };
      break;
    case constants.NOT_FOUND:
      response = {
        error: "NotFoundError",
        message: err.message,
      };
      break;
    case constants.FORBIDDEN:
      response = {
        error: "ForbiddenError",
        message: err.message,
      };
      break;
    case constants.INTERNAL_SERVER_ERROR:
      response = {
        error: "ServerError",
        message: err.message,
      };
      break;
    default:
      response = {
        error: err.name || "UnknownError",
        message: err.message || "An unknown error occurred",
      };
      break;
  }
  res.status(statusCode).json(response);
};

export default errorhandler;
