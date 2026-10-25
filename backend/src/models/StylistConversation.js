/**
 * Persistent AI Stylist conversation
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  clientMessageId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['processing', 'failed', 'complete'],
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const stylistConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'New conversation',
  },
  messages: {
    type: [messageSchema],
    default: [],
  },
  lastMessage: {
    type: String,
    default: '',
    maxlength: 10000,
  },
  messageCount: {
    type: Number,
    min: 0,
    default: 0,
  },
}, {
  timestamps: true,
});

stylistConversationSchema.index({ user: 1, updatedAt: -1 });

stylistConversationSchema.methods.toPublicJSON = function() {
  const conversation = this.toObject();
  delete conversation.__v;
  return conversation;
};

module.exports = mongoose.model('StylistConversation', stylistConversationSchema);
