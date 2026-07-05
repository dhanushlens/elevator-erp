import crypto from 'crypto';
import User from '../models/User.js';
import { sendAuthTokens, verifyRefreshToken, cookieOptions } from '../utils/tokens.js';
import { logActivity } from '../middleware/audit.js';

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
  technician: user.technician,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });
    }
    const allowedRole = ['admin', 'technician', 'employee'].includes(role) ? role : 'employee';
    const user = await User.create({ name, email, password, role: allowedRole, phone });
    const tokens = sendAuthTokens(res, user);
    logActivity(user._id, 'register', 'user', user._id, `User registered (${user.role})`, req.ip);
    res.status(201).json({ success: true, data: { user: userResponse(user), ...tokens } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const tokens = sendAuthTokens(res, user);
    logActivity(user._id, 'login', 'user', user._id, `User logged in (${user.role})`, req.ip);
    res.json({ success: true, data: { user: userResponse(user), ...tokens } });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token provided' });
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    const tokens = sendAuthTokens(res, user);
    res.json({ success: true, data: { user: userResponse(user), ...tokens } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('accessToken', cookieOptions(0));
  res.clearCookie('refreshToken', cookieOptions(0));
  res.json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  res.json({ success: true, data: { user: userResponse(req.user) } });
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    const tokens = sendAuthTokens(res, user);
    res.json({ success: true, message: 'Password updated', data: tokens });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    // Always respond the same to prevent user enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been generated.' });
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    // In production, send resetUrl via email service. Returned here for integration.
    res.json({
      success: true,
      message: 'If that email exists, a reset link has been generated.',
      resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
    }
    if (!req.body.password || req.body.password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    const tokens = sendAuthTokens(res, user);
    res.json({ success: true, message: 'Password has been reset', data: { user: userResponse(user), ...tokens } });
  } catch (err) {
    next(err);
  }
};
