/**
 * Microservice Proxy Routes
 * Proxies requests to the FastAPI microservice for classify and search
 */
const express = require('express');
const { body, query } = require('express-validator');
const microserviceController = require('../controllers/microserviceController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const searchValidation = [
  body('query')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Query must be between 1 and 200 characters'),
  body('numResults')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of results must be between 1 and 50'),
];

const classifyValidation = [
  // Image is validated by multer
];

// Routes
/**
 * @route POST /api/microservice/search
 * @description Search for clothing products (text or image)
 * @access Private
 */
router.post('/search', searchValidation, validate, microserviceController.searchProducts);

/**
 * @route POST /api/microservice/search/image
 * @description Search for clothing products by image
 * @access Private
 */
router.post('/search/image', uploadSingle('image'), microserviceController.searchByImage);

/**
 * @route POST /api/microservice/classify
 * @description Classify a clothing image
 * @access Private
 */
router.post('/classify', uploadSingle('image'), microserviceController.classifyImage);

/**
 * @route POST /api/microservice/chat
 * @description Chat with the AI assistant
 * @access Private
 */
router.post('/chat', [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  body('history').optional().isArray(),
], validate, microserviceController.chat);

module.exports = router;