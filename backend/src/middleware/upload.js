/**
 * File Upload Middleware
 * Uses multer for handling multipart/form-data
 */
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { AppError } = require('./errorHandler');

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: 1,
  },
});

// Single file upload middleware
const uploadSingle = (fieldName) => (req, res, next) => {
  const uploader = upload.single(fieldName);
  
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(`File too large. Max size: ${config.maxFileSize / (1024 * 1024)}MB`, 400));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError('Too many files. Only 1 file allowed', 400));
      }
      return next(new AppError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  const uploader = upload.array(fieldName, maxCount);
  
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(`File too large. Max size: ${config.maxFileSize / (1024 * 1024)}MB`, 400));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError(`Too many files. Max ${maxCount} files allowed`, 400));
      }
      return next(new AppError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

/**
 * Convert uploaded file to base64 data URL
 */
const fileToDataUrl = (file) => {
  if (!file) return null;
  
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64}`;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  fileToDataUrl,
};