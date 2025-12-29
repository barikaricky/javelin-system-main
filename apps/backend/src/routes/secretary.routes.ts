import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { notifyDirectorsOfOperatorRegistration } from '../services/notification.service';
import { User, Operator } from '../models';
import {
  registerSecretary,
  getAllSecretaries,
  getSecretaryById,
  updateSecretary,
  deleteSecretary,
  getSecretaryStats,
} from '../services/secretary.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Manager can register secretaries
router.post(
  '/register',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req: any, res) => {
    logger.info('Secretary registration request', { 
      managerId: req.user.userId,
      body: req.body,
    });
    
    // Validate required fields - check for undefined/null, not empty strings or 0
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'gender', 'dateOfBirth', 'address', 'state', 'regionAssigned', 'startDate', 'bankName', 'bankAccountNumber'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    // For salary and salaryCategory, check specifically
    if (req.body.salary === undefined || req.body.salary === null) {
      missingFields.push('salary');
    }
    if (!req.body.salaryCategory || req.body.salaryCategory === '') {
      missingFields.push('salaryCategory');
    }
    
    if (missingFields.length > 0) {
      logger.error('Missing required fields', { missingFields, receivedData: req.body });
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
      });
    }
    
    logger.info('All required fields present, proceeding with registration...');
    
    try {
      const result = await registerSecretary(req.body, req.user.userId);
      
      logger.info('Secretary service returned successfully', {
        secretaryId: result.secretary._id,
        credentials: result.credentials,
      });
      
      res.status(201).json({
        message: 'Secretary registered successfully',
        secretary: result.secretary,
        credentials: result.credentials,
      });
      
      logger.info('Response sent to client successfully');
    } catch (error: any) {
      logger.error('Error in secretary registration route:', {
        error: error.message,
        stack: error.stack,
      });
      throw error; // Let asyncHandler deal with it
    }
  })
);

// Get all secretaries
router.get(
  '/',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const secretaries = await getAllSecretaries();
    res.json(secretaries);
  })
);

// Get secretary stats
router.get(
  '/stats',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const stats = await getSecretaryStats();
    res.json(stats);
  })
);

// Get secretary by ID
router.get(
  '/:id',
  authorize('MANAGER', 'DIRECTOR', 'SECRETARY', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const secretary = await getSecretaryById(req.params.id);
    res.json(secretary);
  })
);

// Update secretary
router.put(
  '/:id',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const result = await updateSecretary(req.params.id, req.body);
    res.json({
      message: 'Secretary updated successfully',
      secretary: result.secretary,
    });
  })
);

// Delete secretary
router.delete(
  '/:id',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const result = await deleteSecretary(req.params.id);
    res.json(result);
  })
);

// Helper function to generate employee ID
function generateEmployeeId(prefix: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Register Operator (Secretary can register, requires Manager/Director approval)
router.post('/register-operator', authorize('SECRETARY', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    gender,
    dateOfBirth,
    address,
    state,
    lga,
    locationId,
    bitId,
    supervisorId,
    salary,
    salaryCategory,
    bankName,
    bankAccountNumber,
    guarantor1Name,
    guarantor1Phone,
    guarantor1Address,
    guarantor2Name,
    guarantor2Phone,
    guarantor2Address,
    applicantPhoto,
    passportPhoto,
    leftThumb,
    rightThumb,
  } = req.body;

  const secretaryUserId = req.user?.userId;

  logger.info('Operator registration request by Secretary', {
    email,
    secretaryId: secretaryUserId,
  });

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  // Check if phone already exists
  if (phoneNumber) {
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ error: 'A user with this phone number already exists' });
    }
  }

  // Generate employee ID
  const employeeId = generateEmployeeId('OPR');

  // Generate temporary password
  const temporaryPassword = `Opr${Math.random().toString(36).substring(2, 10)}!`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  try {
    // Create user with PENDING status (requires Manager/Director approval)
    const newUser = new User({
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || undefined,
      passwordHash: hashedPassword,
      role: 'OPERATOR',
      status: 'PENDING',
      firstName,
      lastName,
      profilePhoto: applicantPhoto || passportPhoto,
    });

    await newUser.save();
    logger.info('User created for operator', { userId: newUser._id });

    // Create operator profile with PENDING approval status
    const newOperator = new Operator({
      userId: newUser._id,
      employeeId,
      gender,
      dateOfBirth,
      address,
      state,
      lga,
      locationId: locationId || null,
      bitId: bitId || null,
      supervisorId: supervisorId || null,
      salary: salary || 0,
      salaryCategory: salaryCategory || 'STANDARD',
      bankName: bankName || '',
      bankAccountNumber: bankAccountNumber || '',
      guarantor1Name,
      guarantor1Phone,
      guarantor1Address,
      guarantor2Name,
      guarantor2Phone,
      guarantor2Address,
      applicantPhoto,
      passportPhoto,
      leftThumb,
      rightThumb,
      approvalStatus: 'PENDING', // Registered by secretary, requires approval
      registeredBy: secretaryUserId,
    });

    await newOperator.save();
    logger.info('Operator profile created', { operatorId: newOperator._id });

    // Notify directors about new operator registration
    await notifyDirectorsOfOperatorRegistration(newOperator._id.toString());

    res.status(201).json({
      message: 'Operator registered successfully. Awaiting Manager/Director approval.',
      operator: {
        _id: newOperator._id,
        employeeId,
        userId: {
          _id: newUser._id,
          firstName,
          lastName,
          email: newUser.email,
        },
        approvalStatus: 'PENDING',
      },
      credentials: {
        email: newUser.email,
        temporaryPassword,
      },
    });
  } catch (error: any) {
    logger.error('Error registering operator:', error);
    throw error;
  }
}));

// Get all operators (for secretary view)
router.get('/operators', authorize('SECRETARY', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  try {
    const operators = await Operator.find()
      .populate('userId', 'firstName lastName email phoneNumber profilePhoto')
      .populate('locationId', 'locationName')
      .populate('bitId', 'bitName')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      operators: operators.map((op: any) => ({
        ...op,
        userId: {
          ...op.userId,
          _id: op.userId._id,
          firstName: op.userId.firstName,
          lastName: op.userId.lastName,
          email: op.userId.email,
          phoneNumber: op.userId.phoneNumber,
          profilePhoto: op.userId.profilePhoto,
        },
      })),
    });
  } catch (error: any) {
    logger.error('Error fetching operators:', error);
    throw error;
  }
}));

export default router;
