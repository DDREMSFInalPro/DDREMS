/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error.",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize unique constraint
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "A record with this data already exists.",
    });
  }

  // Multer file size
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size exceeds the maximum allowed limit.",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
