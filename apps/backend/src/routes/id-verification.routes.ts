import { Router, Request, Response } from 'express';
import { User } from '../models';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/verify-id/:userId
 * @desc    Public endpoint to verify ID card and get basic user info
 * @access  Public
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Find user by ID
    const user = await User.findById(userId)
      .select('firstName lastName employeeId email phone role department status profilePhoto createdAt');

    if (!user) {
      logger.warn(`ID verification failed: User not found - ${userId}`);
      return res.status(404).json({ error: 'ID card not found or invalid' });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      logger.warn(`ID verification: Inactive user - ${userId} (${user.status})`);
      return res.status(403).json({ 
        error: 'This ID card is no longer active',
        status: user.status 
      });
    }

    logger.info(`ID verified successfully: ${user.employeeId} - ${user.firstName} ${user.lastName}`);

    // Return sanitized user info
    res.json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        status: user.status,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt
      },
      verifiedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('ID verification error:', error);
    res.status(500).json({ error: 'Failed to verify ID card' });
  }
});

export default router;
