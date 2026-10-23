/**
 * Wardrobe Routes
 */
const express = require('express');
const { body, query, param } = require('express-validator');
const wardrobeController = require('../controllers/wardrobeController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { uploadSingle, fileToDataUrl } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createItemValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Tops',
      'Bottoms',
      'Outerwear',
      'Dresses/Jumpsuits',
      'Footwear',
      'Accessories',
      'Ethnic/Traditional Wear',
      'Activewear',
    ])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters'),
  body('color.primary')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('color.secondary')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('brand')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body('season')
    .optional()
    .isIn(['Spring', 'Summer', 'Fall', 'Winter', 'All Season'])
    .withMessage('Invalid season'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const updateItemValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('category')
    .optional()
    .isIn([
      'Tops',
      'Bottoms',
      'Outerwear',
      'Dresses/Jumpsuits',
      'Footwear',
      'Accessories',
      'Ethnic/Traditional Wear',
      'Activewear',
    ])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('color.primary')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('color.secondary')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('brand')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body('season')
    .optional()
    .isIn(['Spring', 'Summer', 'Fall', 'Winter', 'All Season'])
    .withMessage('Invalid season'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const listValidation = [
  query('category')
    .optional()
    .isIn([
      'Tops',
      'Bottoms',
      'Outerwear',
      'Dresses/Jumpsuits',
      'Footwear',
      'Accessories',
      'Ethnic/Traditional Wear',
      'Activewear',
    ])
    .withMessage('Invalid category'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'category', 'wearCount'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid item ID'),
];

// Routes
router.get('/categories', wardrobeController.getCategories);

router.get('/items', listValidation, validate, wardrobeController.getItems);
router.get('/items/stats', wardrobeController.getStats);
router.get('/items/:id', idValidation, validate, wardrobeController.getItem);

router.post('/items', createItemValidation, validate, wardrobeController.createItem);
router.post('/items/upload', uploadSingle('image'), wardrobeController.createItemWithUpload);

router.put('/items/:id', idValidation, updateItemValidation, validate, wardrobeController.updateItem);
router.put('/items/:id/upload', idValidation, validate, uploadSingle('image'), wardrobeController.updateItemWithUpload);

router.delete('/items/:id', idValidation, validate, wardrobeController.deleteItem);
router.post('/items/:id/wear', idValidation, validate, wardrobeController.incrementWearCount);

module.exports = router;