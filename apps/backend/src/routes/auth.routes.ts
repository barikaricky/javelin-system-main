import { Router } from 'express';
import { login, register, getCurrentUser } from '../services/auth.service';
import { createDirector } from '../services/director-onboarding.service';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required' 
    });
  }
  
  logger.info('Login attempt', { email });
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
  const userAgent = req.headers['user-agent'];
  
  const result = await login(email, password, ipAddress, userAgent);
  logger.info('Login successful', { email });
  
  res.json(result);
}));

// Register (for dev/director initialization only)
router.post('/register', asyncHandler(async (req, res) => {
  logger.info('Registration attempt', { email: req.body.email, role: req.body.role });
  const result = await register(req.body);
  logger.info('Registration successful', { email: req.body.email });
  res.status(201).json(result);
}));

// Create Director (for initial setup only)
router.post('/director/create', asyncHandler(async (req, res) => {
  logger.info('Director creation attempt', { email: req.body.email });
  const result = await createDirector(req.body);
  logger.info('Director created successfully', { email: req.body.email });
  res.status(201).json(result);
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: any, res) => {
  const user = await getCurrentUser(req.user.userId);
  res.json(user);
}));

// Change password
router.post('/change-password', authenticate, asyncHandler(async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }

  const bcrypt = require('bcryptjs');
  const User = require('../models').User;
  
  // Get user
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update password
  user.passwordHash = hashedPassword;
  await user.save();

  logger.info('Password changed successfully', { userId: user._id, email: user.email });

  res.json({ message: 'Password changed successfully' });
}));

export default router;
