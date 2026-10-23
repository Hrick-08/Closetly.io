/**
 * Wardrobe Controller
 */
const { WardrobeItem } = require('../models');
const { catchAsync, AppError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { fileToDataUrl } = require('../middleware/upload');

/**
 * @route GET /api/wardrobe/categories
 * @description Get all categories used by the user
 * @access Private
 */
exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = await WardrobeItem.getUserCategoriesWithCounts(req.user._id);
  
  res.json({
    success: true,
    data: {
      categories: categories.map(c => ({
        name: c._id,
        count: c.count,
      })),
    },
  });
});

/**
 * @route GET /api/wardrobe/items/stats
 * @description Get wardrobe statistics
 * @access Private
 */
exports.getStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  
  const [
    totalItems,
    categoryStats,
    recentItems,
    mostWorn,
  ] = await Promise.all([
    WardrobeItem.countDocuments({ user: userId }),
    WardrobeItem.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    WardrobeItem.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category imageBase64 createdAt'),
    WardrobeItem.find({ user: userId, wearCount: { $gt: 0 } })
      .sort({ wearCount: -1 })
      .limit(5)
      .select('name category imageBase64 wearCount lastWorn'),
  ]);
  
  res.json({
    success: true,
    data: {
      totalItems,
      categoryStats: categoryStats.map(c => ({ category: c._id, count: c.count })),
      recentItems,
      mostWorn,
    },
  });
});

/**
 * @route GET /api/wardrobe/items
 * @description Get all wardrobe items with filters
 * @access Private
 */
exports.getItems = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const {
    category,
    search,
    limit = 50,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;
  
  // Build query
  const query = { user: userId };
  
  if (category) {
    query.category = category;
  }
  
  if (search) {
    query.$text = { $search: search };
  }
  
  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  // Execute query
  const [items, total] = await Promise.all([
    WardrobeItem.find(query)
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit)),
    WardrobeItem.countDocuments(query),
  ]);
  
  res.json({
    success: true,
    data: {
      items: items.map(item => item.toPublicJSON()),
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    },
  });
});

/**
 * @route GET /api/wardrobe/items/:id
 * @description Get a single wardrobe item
 * @access Private
 */
exports.getItem = catchAsync(async (req, res, next) => {
  const item = await WardrobeItem.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  
  if (!item) {
    return next(new NotFoundError('Item not found'));
  }
  
  res.json({
    success: true,
    data: {
      item: item.toPublicJSON(),
    },
  });
});

/**
 * @route POST /api/wardrobe/items
 * @description Create a new wardrobe item
 * @access Private
 */
exports.createItem = catchAsync(async (req, res, next) => {
  const { name, category, tags, color, brand, season, notes } = req.body;
  
  const item = await WardrobeItem.create({
    user: req.user._id,
    name,
    category,
    tags: tags || [],
    color: color || {},
    brand,
    season,
    notes,
  });
  
  res.status(201).json({
    success: true,
    message: 'Item added to wardrobe',
    data: {
      item: item.toPublicJSON(),
    },
  });
});

/**
 * @route POST /api/wardrobe/items/upload
 * @description Create a new wardrobe item with image upload
 * @access Private
 */
exports.createItemWithUpload = catchAsync(async (req, res, next) => {
  const { name, category, tags, color, brand, season, notes } = req.body;
  
  if (!req.file) {
    return next(new AppError('Image file is required', 400));
  }
  
  const imageBase64 = fileToDataUrl(req.file);
  
  const item = await WardrobeItem.create({
    user: req.user._id,
    name,
    category,
    imageBase64,
    imageMetadata: {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
    tags: tags ? JSON.parse(tags) : [],
    color: color ? JSON.parse(color) : {},
    brand,
    season,
    notes,
  });
  
  res.status(201).json({
    success: true,
    message: 'Item added to wardrobe',
    data: {
      item: item.toPublicJSON(),
    },
  });
});

/**
 * @route PUT /api/wardrobe/items/:id
 * @description Update a wardrobe item
 * @access Private
 */
exports.updateItem = catchAsync(async (req, res, next) => {
  const { name, category, tags, color, brand, season, notes } = req.body;
  
  const updates = {};
  if (name) updates.name = name;
  if (category) updates.category = category;
  if (tags) updates.tags = tags;
  if (color) updates.color = color;
  if (brand !== undefined) updates.brand = brand;
  if (season) updates.season = season;
  if (notes !== undefined) updates.notes = notes;
  
  const item = await WardrobeItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  
  if (!item) {
    return next(new NotFoundError('Item not found'));
  }
  
  res.json({
    success: true,
    message: 'Item updated successfully',
    data: {
      item: item.toPublicJSON(),
    },
  });
});

/**
 * @route PUT /api/wardrobe/items/:id/upload
 * @description Update a wardrobe item with new image
 * @access Private
 */
exports.updateItemWithUpload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Image file is required', 400));
  }
  
  const imageBase64 = fileToDataUrl(req.file);
  
  const item = await WardrobeItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    {
      imageBase64,
      imageMetadata: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    },
    { new: true, runValidators: true }
  );
  
  if (!item) {
    return next(new NotFoundError('Item not found'));
  }
  
  res.json({
    success: true,
    message: 'Item image updated successfully',
    data: {
      item: item.toPublicJSON(),
    },
  });
});

/**
 * @route DELETE /api/wardrobe/items/:id
 * @description Delete a wardrobe item
 * @access Private
 */
exports.deleteItem = catchAsync(async (req, res, next) => {
  const item = await WardrobeItem.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  
  if (!item) {
    return next(new NotFoundError('Item not found'));
  }
  
  res.json({
    success: true,
    message: 'Item deleted successfully',
  });
});

/**
 * @route POST /api/wardrobe/items/:id/wear
 * @description Increment wear count for an item
 * @access Private
 */
exports.incrementWearCount = catchAsync(async (req, res, next) => {
  const item = await WardrobeItem.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  
  if (!item) {
    return next(new NotFoundError('Item not found'));
  }
  
  item.wearCount += 1;
  item.lastWorn = new Date();
  await item.save();
  
  res.json({
    success: true,
    message: 'Wear count incremented',
    data: {
      item: item.toPublicJSON(),
    },
  });
});