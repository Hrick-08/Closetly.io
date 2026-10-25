/**
 * Authenticated AI Stylist conversation routes
 */
const express = require('express');
const { body, param, query } = require('express-validator');
const stylistController = require('../controllers/stylistController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

const conversationIdValidation = [
  param('id').isMongoId().withMessage('Invalid conversation ID'),
];

router.post('/conversations', stylistController.createConversation);
router.get(
  '/conversations',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  validate,
  stylistController.getConversations
);
router.get(
  '/conversations/:id',
  conversationIdValidation,
  validate,
  stylistController.getConversation
);
router.delete(
  '/conversations/:id',
  conversationIdValidation,
  validate,
  stylistController.deleteConversation
);
router.post(
  '/conversations/:id/messages',
  [
    ...conversationIdValidation,
    body('message')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),
    body('clientMessageId')
      .optional()
      .isUUID()
      .withMessage('Client message ID must be a UUID'),
  ],
  validate,
  stylistController.sendMessage
);

module.exports = router;
