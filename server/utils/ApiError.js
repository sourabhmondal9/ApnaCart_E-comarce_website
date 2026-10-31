/**
 * Standard application error with an HTTP status code attached.
 * Thrown anywhere in controllers/middleware and caught by errorMiddleware.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
