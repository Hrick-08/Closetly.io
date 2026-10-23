/**
 * Auth Controller
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { User } = require('../models');
const { catchAsync, AppError, UnauthorizedError, ConflictError } = require('../middleware/errorHandler');

/**
 * Generate access and refresh tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpire }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Set token cookies
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  };
  
  res.cookie('token', accessToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

/**
 * Clear token cookies
 */
const clearTokenCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  };
  
  res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
  res.cookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });
};

/**
 * @route POST /api/auth/signup
 * @description Register a new user
 * @access Public
 */
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return next(new ConflictError('An account with this email already exists'));
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
  });
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Store refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();
  
  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);
  
  // Send response
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
    },
  });
});

/**
 * @route POST /api/auth/login
 * @description Login user
 * @access Public
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Find user with password
  const user = await User.findByEmail(email).select('+password');
  
  if (!user) {
    return next(new UnauthorizedError('Invalid email or password'));
  }
  
  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new UnauthorizedError('Invalid email or password'));
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Store refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();
  
  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);
  
  // Send response
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
    },
  });
});

/**
 * @route POST /api/auth/refresh
 * @description Refresh access token
 * @access Public (uses refresh token)
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
  // Get refresh token from cookie or body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    return next(new UnauthorizedError('Refresh token required'));
  }
  
  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
  } catch (error) {
    return next(new UnauthorizedError('Invalid refresh token'));
  }
  
  if (decoded.type !== 'refresh') {
    return next(new UnauthorizedError('Invalid token type'));
  }
  
  // Find user and check if refresh token exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new UnauthorizedError('User not found'));
  }
  
  const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
  if (!tokenExists) {
    // Possible token reuse attack - remove all refresh tokens
    user.refreshTokens = [];
    await user.save();
    return next(new UnauthorizedError('Invalid refresh token'));
  }
  
  // Generate new tokens
  const tokens = generateTokens(user);
  
  // Replace refresh token (rotate)
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
  user.refreshTokens.push({ token: tokens.refreshToken });
  await user.save();
  
  // Set cookies
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  
  res.json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

/**
 * @route POST /api/auth/logout
 * @description Logout user
 * @access Private
 */
exports.logout = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (refreshToken && req.user) {
    // Remove refresh token from user
    req.user.refreshTokens = req.user.refreshTokens.filter(rt => rt.token !== refreshToken);
    await req.user.save();
  }
  
  // Clear cookies
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @route GET /api/auth/me
 * @description Get current user profile
 * @access Private
 */
exports.getMe = catchAsync(async (req, res, next) => {
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
    },
  });
});

/**
 * @route PUT /api/auth/me
 * @description Update user profile
 * @access Private
 */
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, avatarUrl } = req.body;
  
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toPublicJSON(),
    },
  });
});

/**
 * @route PUT /api/auth/change-password
 * @description Change user password
 * @access Private
 */
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new UnauthorizedError('Current password is incorrect'));
  }
  
  // Update password
  user.password = newPassword;
  // Invalidate all refresh tokens on password change
  user.refreshTokens = [];
  await user.save();
  
  // Clear cookies since all sessions are invalidated
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

/**
 * @route POST /api/auth/forgot-password
 * @description Request password reset
 * @access Public
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    return res.json({
      success: true,
      message: 'If an account exists, a reset link will be sent',
    });
  }
  
  // Generate reset token (in production, send via email)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  
  // In production, send email with resetToken
  // For now, return token in development
  if (config.nodeEnv === 'development') {
    return res.json({
      success: true,
      message: 'Password reset token generated (development only)',
      data: { resetToken },
    });
  }
  
  res.json({
    success: true,
    message: 'If an account exists, a reset link will be sent',
  });
});

/**
 * @route POST /api/auth/reset-password
 * @description Reset password with token
 * @access Public
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return next(new AppError('Token and new password are required', 400));
  }
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }
  
  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();
  
  // Clear cookies
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'Password reset successful. Please log in again.',
  });
});

/**
 * @route DELETE /api/auth/me
 * @description Delete user account
 * @access Private
 */
exports.deleteAccount = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  
  // Verify password for security
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    return next(new UnauthorizedError('Password is incorrect'));
  }
  
  // Delete user (cascade will handle wardrobe items if set up)
  await User.findByIdAndDelete(req.user._id);
  
  // Clear cookies
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
});