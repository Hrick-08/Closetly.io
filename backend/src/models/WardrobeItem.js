/**
 * Wardrobe Item Model
 */
const mongoose = require('mongoose');

const VALID_CATEGORIES = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Dresses/Jumpsuits',
  'Footwear',
  'Accessories',
  'Ethnic/Traditional Wear',
  'Activewear',
];

const wardrobeItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: VALID_CATEGORIES,
      message: 'Invalid category. Must be one of: {VALUE}',
    },
    index: true,
  },
  imageBase64: {
    type: String,
    default: '',
  },
  // Optional: store image metadata
  imageMetadata: {
    originalName: String,
    mimeType: String,
    size: Number,
  },
  // Optional: tags for better search
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  // Optional: color info
  color: {
    primary: String,
    secondary: String,
  },
  // Optional: brand/season info
  brand: String,
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'],
  },
  // Optional: wear tracking
  wearCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastWorn: Date,
  // Optional: notes
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for common queries
wardrobeItemSchema.index({ user: 1, createdAt: -1 });
wardrobeItemSchema.index({ user: 1, category: 1 });
wardrobeItemSchema.index({ user: 1, name: 'text', tags: 'text' });
wardrobeItemSchema.index({ user: 1, 'color.primary': 1 });
wardrobeItemSchema.index({ user: 1, season: 1 });

// Virtual for image URL (if using external storage)
wardrobeItemSchema.virtual('imageUrl').get(function() {
  return this.imageBase64 || null;
});

// Static method to get valid categories
wardrobeItemSchema.statics.getValidCategories = function() {
  return VALID_CATEGORIES;
};

// Static method to get user's categories with counts
wardrobeItemSchema.statics.getUserCategoriesWithCounts = async function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

// Instance method to increment wear count
wardrobeItemSchema.methods.incrementWearCount = function() {
  this.wearCount += 1;
  this.lastWorn = new Date();
  return this.save();
};

// Transform output
wardrobeItemSchema.methods.toPublicJSON = function() {
  const item = this.toObject();
  delete item.__v;
  return item;
};

module.exports = mongoose.model('WardrobeItem', wardrobeItemSchema);