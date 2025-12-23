import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { User, Manager, Supervisor, Operator, Secretary } from '../models';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);

// Get all personnel (for Director/Admin)
router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📋 Fetching all personnel - START');
    const userRole = req.user?.role;
    console.log('👤 User role:', userRole);
    
    // Only DIRECTOR and DEVELOPER can view all personnel
    if (!['DIRECTOR', 'DEVELOPER'].includes(userRole || '')) {
      console.log('❌ Not authorized');
      return res.status(403).json({ error: 'Not authorized to view all personnel' });
    }

    const { role, status, search, page = '1', limit = '50' } = req.query;
    console.log('🔍 Query params:', { role, status, search, page, limit });
    
    const filter: any = {};
    
    if (role && role !== 'ALL') {
      filter.role = role as string;
    }
    
    if (status && status !== 'ALL') {
      filter.status = status as string;
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search as string, $options: 'i' } },
        { lastName: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
        { employeeId: { $regex: search as string, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    console.log('🔎 Querying users with filter:', filter);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('id employeeId email firstName lastName phone role status profilePhoto passportPhoto createdAt lastLogin')
        .sort({ role: 1, firstName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);
    
    console.log(`✅ Found ${users.length} users out of ${total} total`);

    // Get related data for each user (map _id to id since .lean() doesn't apply transforms)
    console.log('🔄 Enriching user data...');
    const enrichedUsers = await Promise.all(
      users.map(async (user: any) => {
        const userData: any = { ...user, id: user._id.toString() };
        delete userData._id;
        
        // Get salary based on role
        if (user.role === 'MANAGER') {
          const manager = await Manager.findOne({ userId: user._id })
            .select('id department startDate')
            .lean();
          if (manager) {
            userData.managers = [manager];
          }
          // Managers don't have salary in their model, set to null
          userData.salary = null;
        } else if (user.role === 'SUPERVISOR' || user.role === 'GENERAL_SUPERVISOR') {
          const supervisor = await Supervisor.findOne({ userId: user._id })
            .select('id supervisorType regionAssigned shiftType salary')
            .lean();
          if (supervisor) {
            userData.supervisors = [supervisor];
            userData.salary = supervisor.salary;
          }
        } else if (user.role === 'OPERATOR') {
          const operator = await Operator.findOne({ userId: user._id })
            .select('id employeeId salary')
            .lean();
          if (operator) {
            userData.operators = [operator];
            userData.salary = operator.salary;
          }
        } else if (user.role === 'SECRETARY') {
          const secretary = await Secretary.findOne({ userId: user._id })
            .select('id salary')
            .lean();
          if (secretary) {
            userData.salary = secretary.salary;
          }
        }
        
        return userData;
      })
    );
    
    console.log('✅ User data enriched');

    // Get counts by role
    console.log('📊 Getting role counts...');
    const roleCounts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const countsByRole = roleCounts.reduce((acc: any, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    console.log('✅ Role counts retrieved:', countsByRole);
    console.log('📤 Sending response...');

    res.json({
      users: enrichedUsers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      countsByRole,
    });
    
    console.log('✅ Response sent successfully');
  } catch (error) {
    logger.error('Error fetching all personnel:', error);
    console.error('❌ Error fetching all personnel:', error);
    res.status(500).json({ error: 'Failed to fetch personnel' });
  }
});

// Get current user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await User.findById(userId)
      .select('id email firstName lastName phone role status profilePhoto passportPhoto createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Upload profile picture (base64)
router.post('/profile/photo', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { photo } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!photo) {
      return res.status(400).json({ error: 'No photo data provided' });
    }

    // Validate base64 string
    if (!photo.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Update user profile with base64 photo
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: photo, updatedAt: new Date() },
      { new: true }
    ).select('id email firstName lastName phone role profilePhoto').lean();

    logger.info(`Profile photo updated for user ${userId}`);
    res.json({ 
      message: 'Profile photo uploaded successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error uploading profile photo:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

// Delete profile picture
router.delete('/profile/photo', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current photo
    const user = await User.findById(userId).select('profilePhoto').lean();

    if (!user?.profilePhoto) {
      return res.status(400).json({ error: 'No profile photo to delete' });
    }

    // Update user to remove photo reference (no file deletion needed for base64)
    await User.findByIdAndUpdate(userId, {
      profilePhoto: null,
      updatedAt: new Date(),
    });

    logger.info(`Profile photo deleted for user ${userId}`);
    res.json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    logger.error('Error deleting profile photo:', error);
    res.status(500).json({ error: 'Failed to delete profile photo' });
  }
});

// Update user profile (name, phone, etc.)
router.patch('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updateData: any = { updatedAt: new Date() };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('id email firstName lastName phone role profilePhoto').lean();

    logger.info(`Profile updated for user ${userId}`);
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get operators under a supervisor (for Director viewing)
router.get('/supervisor/:supervisorId/operators', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { supervisorId } = req.params;
    
    // Only DIRECTOR, DEVELOPER, and MANAGER can view this
    if (!['DIRECTOR', 'DEVELOPER', 'MANAGER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Not authorized to view supervisor operators' });
    }

    // Get the supervisor to find their supervisor record
    const supervisor = await Supervisor.findOne({ userId: supervisorId }).select('id').lean();

    if (!supervisor) {
      // Try finding a general supervisor
      const generalSupervisor = await GeneralSupervisor.findOne({ userId: supervisorId }).select('id').lean();

      if (!generalSupervisor) {
        return res.json({ operators: [] });
      }

      // Get supervisors under this GS, then their operators
      const gsupervisors = await Supervisor.find({ generalSupervisorId: generalSupervisor._id }).select('id').lean();

      const supervisorIds = gsupervisors.map(s => s._id);

      const operators = await Operator.find({ supervisorId: { $in: supervisorIds } })
        .populate('userId', 'id employeeId email firstName lastName phone role status profilePhoto createdAt')
        .lean();

      return res.json({
        operators: operators.map((op: any) => ({
          ...op.userId,
          operatorId: op._id,
        })),
      });
    }

    // Get operators under this supervisor
    const operators = await Operator.find({ supervisorId: supervisor._id })
      .populate('userId', 'id employeeId email firstName lastName phone role status profilePhoto createdAt')
      .lean();

    res.json({
      operators: operators.map((op: any) => ({
        ...op.userId,
        operatorId: op._id,
      })),
    });
  } catch (error) {
    logger.error('Error fetching supervisor operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
});

// Update any user (Director only)
router.put('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { userId } = req.params;
    const { firstName, lastName, email, phone, status, address } = req.body;
    
    // Only DIRECTOR and DEVELOPER can update any user
    if (!['DIRECTOR', 'DEVELOPER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Not authorized to update users' });
    }

    const updateData: any = { updatedAt: new Date() };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    if (address !== undefined) updateData.address = address;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('id employeeId email firstName lastName phone role status profilePhoto').lean();

    logger.info(`User ${userId} updated by ${req.user?.userId}`);
    res.json({ 
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete any user (Director only)
router.delete('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const currentUserId = req.user?.userId;
    const { userId } = req.params;
    
    // Only DIRECTOR and DEVELOPER can delete users
    if (!['DIRECTOR', 'DEVELOPER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Not authorized to delete users' });
    }

    // Prevent self-deletion
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get user to check role
    const userToDelete = await User.findById(userId).select('role').lean();

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot delete other directors
    if (userToDelete.role === 'DIRECTOR' && userRole !== 'DEVELOPER') {
      return res.status(403).json({ error: 'Cannot delete other directors' });
    }

    // Delete related records first based on role
    if (userToDelete.role === 'OPERATOR') {
      await Operator.deleteMany({ userId });
    } else if (userToDelete.role === 'SUPERVISOR' || userToDelete.role === 'GENERAL_SUPERVISOR') {
      // Both types use the Supervisor model with supervisorType field
      await Supervisor.deleteMany({ userId });
    } else if (userToDelete.role === 'MANAGER') {
      await Manager.deleteMany({ userId });
    } else if (userToDelete.role === 'SECRETARY') {
      await Secretary.deleteMany({ userId });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    logger.info(`User ${userId} deleted by ${currentUserId}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
