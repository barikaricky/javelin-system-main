import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { notifyDirectorsOfOperatorRegistration } from '../services/notification.service';
import { User, Operator, Supervisor } from '../models';
import mongoose from 'mongoose';

const router = Router();

router.use(authenticate);

// Dashboard
router.get('/dashboard', authorize('OPERATOR', 'SUPERVISOR', 'DIRECTOR'), (req, res) => {
  res.json({ message: 'Operator dashboard' });
});

// Get all operators with full details (Admin view)
router.get('/all', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const operators = await Operator.find()
      .select('employeeId userId locationId supervisorId shiftType passportPhoto bankName bankAccount nationalId previousExperience medicalFitness approvalStatus salary startDate createdAt')
      .populate('userId', 'firstName lastName email phone passportPhoto isActive')
      .populate('locationId', 'locationName city state address')
      .populate({
        path: 'supervisorId',
        select: 'employeeId userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(operators);
  } catch (error: any) {
    logger.error('Error fetching all operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
}));

// Helper function to generate employee ID
function generateEmployeeId(prefix: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Register Operator (Supervisor only)
router.post('/register', authorize('SUPERVISOR', 'GENERAL_SUPERVISOR', 'DEVELOPER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    gender,
    dateOfBirth,
    address,
    state,
    lga,
    nationalId,
    passportPhoto,
    locationId,
    shiftType,
    guarantorName,
    guarantorPhone,
    guarantorAddress,
    previousExperience,
    medicalFitness,
    documents,
  } = req.body;

  const supervisorUserId = req.user?.userId;

  logger.info('Operator registration request by Supervisor', {
    email,
    supervisorId: supervisorUserId,
  });

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  // Check if phone already exists
  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ error: 'A user with this phone number already exists' });
    }
  }

  // Get the Supervisor's record
  const supervisor = await Supervisor.findOne({
    userId: supervisorUserId,
    approvalStatus: 'APPROVED',
  }).lean();

  if (!supervisor) {
    return res.status(404).json({ 
      error: 'Supervisor profile not found or not yet approved. Only approved Supervisors can register Operators.' 
    });
  }

  // Get supervisor user info for notification
  const supervisorUser = await User.findById(supervisorUserId).select('firstName lastName').lean();

  // Generate employee ID
  const employeeId = generateEmployeeId('OPR');

  // Generate temporary password
  const temporaryPassword = `Opr${Math.random().toString(36).substring(2, 10)}!`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  try {
    // Create user with PENDING status
    const newUser = new User({
      email: email.toLowerCase(),
      phone: phone || undefined,
      passwordHash: hashedPassword,
      role: 'OPERATOR',
      status: 'PENDING',
      firstName,
      lastName,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      state: state || undefined,
      lga: lga || undefined,
      employeeId,
      passportPhoto: passportPhoto || undefined,
      accountName: `${firstName} ${lastName}`,
      createdById: supervisorUserId,
    });

    await newUser.save();

    // Create operator record
    const newOperator = new Operator({
      userId: newUser._id,
      supervisorId: supervisor._id,
      employeeId,
      locationId: locationId || undefined,
      passportPhoto: passportPhoto || undefined,
      nationalId: nationalId || undefined,
      salary: 0, // Will be set by Manager during approval
      startDate: new Date(),
    });

    await newOperator.save();

    // Notify Directors
    try {
      if (supervisorUser) {
        const supervisorName = `${supervisorUser.firstName} ${supervisorUser.lastName}`;
        await notifyDirectorsOfOperatorRegistration(
          supervisorUserId!,
          supervisorName,
          `${firstName} ${lastName}`,
          email
        );
        logger.info('Directors notified of Operator registration');
      }
    } catch (notifyError) {
      logger.error('Failed to notify directors:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Operator registered successfully. Awaiting Manager approval.',
      operator: {
        id: newOperator._id,
        userId: newUser._id,
        fullName: `${firstName} ${lastName}`,
        email: newUser.email,
        employeeId,
        approvalStatus: 'PENDING',
        temporaryPassword, // Include for supervisor reference
      },
    });
  } catch (error) {
    throw error;
  }
}));

// Get pending operators (General Supervisor)
router.get('/pending', authorize('GENERAL_SUPERVISOR', 'DEVELOPER', 'DIRECTOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  // Find all operators whose user status is PENDING
  let query: any = {};
  
  // If General Supervisor, only show operators under their supervisors
  // DIRECTOR and DEVELOPER can see all
  if (userRole === 'GENERAL_SUPERVISOR') {
    // Get the general supervisor record
    const generalSupervisor = await Supervisor.findOne({ 
      userId, 
      supervisorType: 'GENERAL_SUPERVISOR' 
    }).lean();
    
    if (!generalSupervisor) {
      return res.status(404).json({ error: 'General Supervisor profile not found' });
    }
    
    // Find supervisors under this GS
    const supervisors = await Supervisor.find({ 
      generalSupervisorId: generalSupervisor._id 
    }).select('_id').lean();
    
    const supervisorIds = supervisors.map(s => s._id);
    
    // Only show operators registered by supervisors under this GS
    if (supervisorIds.length > 0) {
      query.supervisorId = { $in: supervisorIds };
    } else {
      // If GS has no supervisors yet, return empty array
      return res.json({
        success: true,
        operators: [],
      });
    }
  }

  const pendingOperators = await Operator.find(query)
    .populate({
      path: 'userId',
      match: { status: 'PENDING' },
      select: 'email firstName lastName phone gender dateOfBirth state lga profilePhoto createdAt employeeId passportPhoto',
    })
    .populate({
      path: 'supervisorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName email phone',
      },
    })
    .populate('locationId', 'name address state lga')
    .sort({ createdAt: -1 })
    .lean();

  // Filter out operators where user didn't match (status wasn't PENDING)
  const filteredOperators = pendingOperators.filter(op => op.userId !== null);

  res.json({
    success: true,
    operators: filteredOperators,
  });
}));

// Get pending operator approvals (Manager only)
router.get('/pending-approvals', authorize('MANAGER', 'DEVELOPER', 'DIRECTOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  // Find all operators whose user status is PENDING
  const pendingOperators = await Operator.find()
    .populate({
      path: 'userId',
      match: { status: 'PENDING' },
      select: 'email firstName lastName phone gender dateOfBirth state lga profilePhoto createdAt',
    })
    .populate({
      path: 'supervisorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName',
      },
    })
    .populate('locationId', 'name address')
    .sort({ createdAt: -1 })
    .lean();

  // Filter out operators where user didn't match (status wasn't PENDING)
  const filteredOperators = pendingOperators.filter(op => op.userId !== null);

  res.json({
    success: true,
    operators: filteredOperators,
  });
}));

// Approve Operator (Manager or General Supervisor)
router.post('/:id/approve', authorize('MANAGER', 'GENERAL_SUPERVISOR', 'DEVELOPER', 'DIRECTOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const operatorId = req.params.id;
  const { salary } = req.body;

  const operator = await Operator.findById(operatorId)
    .populate('userId')
    .populate({
      path: 'supervisorId',
      populate: { path: 'userId' },
    })
    .lean();

  if (!operator) {
    return res.status(404).json({ error: 'Operator not found' });
  }

  const operatorUser = operator.userId as any;
  if (operatorUser.status !== 'PENDING') {
    return res.status(400).json({ error: 'Operator is not pending approval' });
  }

  // Generate new password
  const temporaryPassword = `Opr${Math.random().toString(36).substring(2, 10)}!`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // Update operator salary and approval status
  await Operator.findByIdAndUpdate(operatorId, {
    salary: salary || 0,
    approvalStatus: 'APPROVED',
  });

  // Update user status to ACTIVE and set monthly salary
  await User.findByIdAndUpdate(operatorUser._id, {
    status: 'ACTIVE',
    passwordHash: hashedPassword,
    monthlySalary: salary || 0,
  });

  res.json({
    success: true,
    message: 'Operator approved successfully',
    credentials: {
      email: operatorUser.email,
      password: temporaryPassword,
    },
  });
}));

// Reject Operator (Manager or General Supervisor)
router.post('/:id/reject', authorize('MANAGER', 'GENERAL_SUPERVISOR', 'DEVELOPER', 'DIRECTOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const operatorId = req.params.id;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const operator = await Operator.findById(operatorId).populate('userId').lean();

  if (!operator) {
    return res.status(404).json({ error: 'Operator not found' });
  }

  const operatorUser = operator.userId as any;
  if (operatorUser.status !== 'PENDING') {
    return res.status(400).json({ error: 'Operator is not pending approval' });
  }

  // Update user status to SUSPENDED/REJECTED
  await User.findByIdAndUpdate(operatorUser._id, {
    status: 'SUSPENDED',
  });

  res.json({
    success: true,
    message: 'Operator rejected',
  });
}));

// Get all operators (for supervisors to see their operators)
router.get('/my-operators', authorize('SUPERVISOR', 'GENERAL_SUPERVISOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supervisorUserId = req.user?.userId;

  // Get supervisor record
  const supervisor = await Supervisor.findOne({ userId: supervisorUserId }).lean();
  
  if (!supervisor) {
    return res.status(404).json({ error: 'Supervisor profile not found' });
  }

  const operators = await Operator.find({ supervisorId: supervisor._id })
    .populate('userId', 'email firstName lastName phone status passportPhoto profilePhoto employeeId')
    .populate('locationId', 'name address')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    operators,
  });
}));

export default router;
