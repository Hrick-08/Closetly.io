/**
 * Error Handling Middleware
 */

const config = require('../config');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(e => ({
    field: e.path,
    message: e.message,
  }));
  return new ValidationError('Validation failed', errors);
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new ConflictError(`${field} '${value}' already exists`);
};

/**
 * Handle Mongoose cast errors (invalid ObjectId)
 */
const handleCastError = (err) => {
  return new NotFoundError(`Invalid ${err.path}: ${err.value}`);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new UnauthorizedError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = () => {
  return new UnauthorizedError('Your token has expired. Please log in again.');
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }
  // Programming or other unknown error: don't leak details
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.nodeEnv === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

/**
 * Catch async errors wrapper
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle 404 for undefined routes
 */
const notFound = (req, res, next) => {
  const err = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
  next(err);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  globalErrorHandler,
  catchAsync,
  notFound,
};