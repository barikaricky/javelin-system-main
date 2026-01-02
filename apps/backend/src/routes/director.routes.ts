import { Router, Request } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createSupervisor, getSupervisors, getSupervisorById, updateSupervisor, deleteSupervisor } from '../services/director.service';
import { body } from 'express-validator';
import { registerManager, getManagers } from '../controllers/director.controller';
import { validateRequest } from '../middleware/validation.middleware';
import multer from 'multer';
import mongoose from 'mongoose';
import * as bitService from '../services/bit.service';
import { 
  User, 
  Manager, 
  Supervisor, 
  Operator, 
  Secretary, 
  Location, 
  Poll, 
  IncidentReport, 
  Meeting, 
  Attendance, 
  Expense, 
  Notification,
  Bit,
  Invoice,
  Transaction,
  GuardAssignment
} from '../models';
import MoneyOut from '../models/MoneyOut.model';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Use string 'DIRECTOR' instead of UserRole enum
router.use(authenticate);
router.use(authorize('DIRECTOR'));

// Dashboard Stats - Real data from database using Mongoose
router.get('/dashboard/stats', async (req: Request & { user?: any }, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    console.log('📊 Fetching dashboard stats...');

    // First, let's check what's actually in the database
    const debugCounts = {
      managers: await Manager.countDocuments(),
      allSupervisors: await Supervisor.countDocuments(),
      operators: await Operator.countDocuments(),
      secretaries: await Secretary.countDocuments(),
      allLocations: await Location.countDocuments(),
    };
    console.log('🔍 Debug - Raw document counts:', debugCounts);

    // Debug Money In and Money Out
    const allMoneyInTransactions = await Transaction.countDocuments({ transactionType: 'MONEY_IN' });
    const allMoneyOutRecords = await MoneyOut.countDocuments();
    console.log('💰 Debug - Financial records:', {
      totalMoneyInTransactions: allMoneyInTransactions,
      totalMoneyOutRecords: allMoneyOutRecords,
      startOfMonth: startOfMonth.toISOString(),
    });

    // Fetch operators and supervisors currently on duty (with active assignments)
    const { GuardAssignment } = require('../models/GuardAssignment.model');
    
    // Debug: Check total assignments
    const totalAssignments = await GuardAssignment.countDocuments();
    const activeAssignments = await GuardAssignment.countDocuments({ status: 'ACTIVE' });
    console.log('📊 Assignment counts:', { totalAssignments, activeAssignments });
    
    const onDutyOperators = await GuardAssignment.find({
      status: 'ACTIVE'
    })
      .populate({
        path: 'operatorId',
        populate: { 
          path: 'userId', 
          select: 'firstName lastName email phone phoneNumber profilePhoto passportPhoto status' 
        }
      })
      .populate({
        path: 'supervisorId',
        populate: { 
          path: 'userId', 
          select: 'firstName lastName email phone profilePhoto passportPhoto' 
        }
      })
      .populate('bitId', 'bitName bitCode')
      .populate('locationId', 'locationName address city state')
      .sort({ startDate: -1 })
      .limit(50)
      .lean();

    console.log('👮 On Duty Personnel Found:', onDutyOperators.length);
    
    // Show shift breakdown (display all as stored in database, no time-based filtering)
    console.log('⏰ Shift Breakdown:', {
      totalOnDuty: onDutyOperators.length,
      DAY: onDutyOperators.filter((a: any) => a.shiftType === 'DAY').length,
      NIGHT: onDutyOperators.filter((a: any) => a.shiftType === 'NIGHT').length,
      ROTATING: onDutyOperators.filter((a: any) => a.shiftType === 'ROTATING').length,
    });
    
    // Debug first on-duty person structure
    if (onDutyOperators.length > 0) {
      console.log('📋 First on-duty person sample:', {
        hasOperator: !!onDutyOperators[0].operatorId,
        hasUserId: !!(onDutyOperators[0].operatorId as any)?.userId,
        status: onDutyOperators[0].status,
        shift: onDutyOperators[0].shiftType
      });
    }

    // Fetch all stats in parallel using Mongoose
    const [
      totalManagers,
      totalGeneralSupervisors,
      totalSupervisors,
      totalOperators,
      totalSecretaries,
      totalLocations,
      activePolls,
      pendingApprovals,
      openIncidents,
      meetingsToday,
      todayAttendance,
      monthlyExpenses,
      monthlyMoneyIn,
      monthlyMoneyOut,
      unreadMessages,
      locations,
      topSupervisors,
      totalBits,
      activeBits,
      allUsers,
    ] = await Promise.all([
      // Total Managers
      Manager.countDocuments(),
      // Total General Supervisors
      Supervisor.countDocuments({ supervisorType: 'GENERAL_SUPERVISOR', approvalStatus: 'APPROVED' }),
      // Total Supervisors
      Supervisor.countDocuments({ supervisorType: 'SUPERVISOR', approvalStatus: 'APPROVED' }),
      // Total Operators
      Operator.countDocuments(),
      // Total Secretaries
      Secretary.countDocuments(),
      // Total Locations
      Location.countDocuments({ isActive: true }),
      // Active Polls
      Poll.countDocuments({ status: 'ACTIVE' }),
      // Pending Approvals (supervisors pending approval)
      Supervisor.countDocuments({ approvalStatus: 'PENDING' }),
      // Open Incidents
      IncidentReport.countDocuments({ status: { $in: ['REPORTED', 'UNDER_REVIEW'] } }),
      // Meetings Today
      Meeting.countDocuments({
        scheduledTime: { $gte: today },
        status: { $in: ['SCHEDULED', 'LIVE'] },
      }),
      // Today's Attendance
      Attendance.countDocuments({ checkInTime: { $gte: today } }),
      // Monthly Expenses
      Expense.aggregate([
        {
          $match: {
            expenseDate: { $gte: startOfMonth },
            status: 'APPROVED',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      // Monthly Money In (from Transaction model with MONEY_IN type)
      Transaction.aggregate([
        {
          $match: {
            transactionType: 'MONEY_IN',
            transactionDate: { $gte: startOfMonth },
            deletedAt: { $exists: false },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      // Monthly Money Out (from MoneyOut model - approved/paid requests)
      MoneyOut.aggregate([
        {
          $match: {
            paymentDate: { $gte: startOfMonth },
            approvalStatus: { $in: ['APPROVED', 'PAID'] },
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      // Unread Messages (notifications)
      Notification.countDocuments({
        receiverId: req.user?.userId,
        isRead: false,
      }),
      // Locations with details
      Location.find({ isActive: true })
        .limit(10)
        .lean(),
      // Top Supervisors
      Supervisor.find({ approvalStatus: 'APPROVED' })
        .limit(5)
        .populate('userId', 'firstName lastName profilePhoto')
        .lean(),
      // Total Bits
      Bit.countDocuments(),
      // Active Bits
      Bit.countDocuments({ isActive: true }),
      // All active users
      User.countDocuments({ status: 'ACTIVE' }),
    ]);

    console.log('📊 Raw counts:', {
      totalManagers,
      totalGeneralSupervisors,
      totalSupervisors,
      totalOperators,
      totalSecretaries,
      totalLocations,
      activePolls,
      pendingApprovals,
      openIncidents,
      meetingsToday,
      todayAttendance,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      unreadMessages,
      totalBits,
      activeBits,
      moneyIn: monthlyMoneyIn[0]?.total || 0,
      moneyOut: monthlyMoneyOut[0]?.total || 0,
    });

    // Calculate total personnel
    const totalPersonnel = totalManagers + totalGeneralSupervisors + totalSupervisors + totalOperators + totalSecretaries;

    // Get operator counts per location
    const locationOperatorCounts = await Promise.all(
      locations.map(async (loc: any) => {
        const operatorCount = await Operator.countDocuments({ locationId: loc._id });
        return { locationId: loc._id.toString(), count: operatorCount };
      })
    );

    // Calculate understaffed BITs (BITs where assigned operators < required numberOfOperators)
    const allBits = await Bit.find({ isActive: true }).lean();
    let understaffedLocations = 0;
    
    for (const bit of allBits) {
      const assignedCount = await GuardAssignment.countDocuments({ 
        bitId: bit._id, 
        status: 'ACTIVE' 
      });
      if (assignedCount < bit.numberOfOperators) {
        understaffedLocations++;
      }
    }

    console.log('🔍 Understaffed calculation:', {
      totalActiveBits: allBits.length,
      understaffedBits: understaffedLocations,
    });

    // Map locations to expected format
    const mappedLocations = await Promise.all(
      locations.map(async (loc: any) => {
        const operatorCount = locationOperatorCounts.find(
          (c) => c.locationId === loc._id.toString()
        )?.count || 0;

        // Find supervisor assigned to this location
        const locationSupervisor = await Supervisor.findOne({ locationId: loc._id })
          .populate('userId', 'firstName lastName')
          .lean();

        return {
          id: loc._id.toString(),
          name: loc.locationName || loc.name || 'Unknown',
          region: loc.state || loc.city || 'N/A',
          status: (operatorCount >= 10 ? 'green' : operatorCount >= 5 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
          operators: operatorCount,
          required: 10,
          supervisor: locationSupervisor?.userId 
            ? `${(locationSupervisor.userId as any).firstName} ${(locationSupervisor.userId as any).lastName}`
            : 'Unassigned',
        };
      })
    );

    // Map top supervisors
    const mappedTopSupervisors = await Promise.all(
      topSupervisors.map(async (sup: any) => {
        const operatorsManaged = await Operator.countDocuments({ 
          $or: [
            { supervisorId: sup._id },
            { generalSupervisorId: sup._id }
          ]
        });

        return {
          id: sup._id.toString(),
          name: sup.userId ? `${(sup.userId as any).firstName} ${(sup.userId as any).lastName}` : 'Unknown',
          photo: sup.userId ? (sup.userId as any).profilePhoto : null,
          rating: 4.5,
          region: sup.regionAssigned || 'N/A',
          operatorsManaged,
        };
      })
    );

    // Generate alerts based on data
    const alerts = [];
    if (understaffedLocations > 0) {
      alerts.push({
        id: 1,
        type: 'critical',
        message: `${understaffedLocations} location(s) are understaffed`,
        urgent: true,
      });
    }
    if (pendingApprovals > 0) {
      alerts.push({
        id: 2,
        type: 'warning',
        message: `${pendingApprovals} supervisor approval(s) pending`,
        urgent: true,
      });
    }
    if (openIncidents > 0) {
      alerts.push({
        id: 3,
        type: 'warning',
        message: `${openIncidents} incident(s) require attention`,
        urgent: openIncidents >= 3,
      });
    }

    const statsResult = {
      totalPersonnel,
      guardsOnDuty: onDutyOperators.length,
      activeManagers: totalManagers,
      generalSupervisors: totalGeneralSupervisors,
      supervisors: totalSupervisors,
      operators: totalOperators,
      secretaries: totalSecretaries,
      attendance: {
        present: todayAttendance,
        absent: totalOperators - todayAttendance,
        late: 0,
      },
      meetingsToday,
      activePolls,
      pendingApprovals,
      activeIncidents: openIncidents,
      totalLocations,
      understaffedLocations,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      unreadMessages,
      totalBits,
      activeBits,
      moneyIn: monthlyMoneyIn[0]?.total || 0,
      moneyOut: monthlyMoneyOut[0]?.total || 0,
    };

    console.log('✅ Dashboard stats prepared:', statsResult);

    res.json({
      stats: statsResult,
      locations: mappedLocations,
      topSupervisors: mappedTopSupervisors,
      alerts,
      notifications: [],
      onDutyPersonnel: onDutyOperators,
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    next(error);
  }
});

// Dashboard (legacy endpoint)
router.get('/dashboard', (_req, res) => {
  res.json({ message: 'Director dashboard' });
});

// Supervisor Management
router.post('/supervisors', async (req: Request & { user?: any }, res, next) => {
  try {
    const directorId = req.user!.userId;
    const result = await createSupervisor(directorId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/supervisors', async (req, res, next) => {
  try {
    console.log('📋 GET /director/supervisors - Query params:', req.query);
    const filters = {
      approvalStatus: req.query.approvalStatus as string,
      supervisorType: req.query.supervisorType as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };
    const supervisors = await getSupervisors(filters);
    console.log('✅ Supervisors found:', supervisors.length);
    res.json({ supervisors });
  } catch (error) {
    console.error('❌ Error fetching supervisors:', error);
    next(error);
  }
});

router.get('/supervisors/:id', async (req, res, next) => {
  try {
    const supervisor = await getSupervisorById(req.params.id);
    res.json(supervisor);
  } catch (error) {
    next(error);
  }
});

router.patch('/supervisors/:id', async (req, res, next) => {
  try {
    const supervisor = await updateSupervisor(req.params.id, req.body);
    res.json(supervisor);
  } catch (error) {
    next(error);
  }
});

router.delete('/supervisors/:id', async (req, res, next) => {
  try {
    await deleteSupervisor(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Register new manager
router.post(
  '/register-manager',
  upload.single('profilePicture'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('role').isIn(['manager', 'senior-manager', 'team-lead']).withMessage('Invalid role'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
  ],
  validateRequest,
  registerManager
);

// Get all managers
router.get('/managers', getManagers);

// Notification endpoints
router.get('/notifications', async (req: Request & { user?: any }, res, next) => {
  try {
    const notifications = await Notification.find({ receiverId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedNotifications = notifications.map(n => ({
      _id: n._id.toString(),
      id: n._id.toString(),
      type: mapNotificationType(n.type),
      category: n.subject || 'Notification',
      message: n.message,
      urgent: n.metadata?.priority === 'CRITICAL' || n.metadata?.priority === 'HIGH',
      read: n.isRead,
      createdAt: n.createdAt,
      timestamp: n.createdAt,
      actionUrl: n.actionUrl,
      metadata: n.metadata,
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    next(error);
  }
});

function mapNotificationType(type: string): string {
  const typeMap: Record<string, string> = {
    'REPORT_SUBMITTED': 'warning',
    'REPORT_APPROVED': 'success',
    'REPORT_REJECTED': 'critical',
    'SUPERVISOR_APPROVED': 'success',
    'SUPERVISOR_REJECTED': 'critical',
    'OPERATOR_APPROVED': 'success',
    'MEETING_SCHEDULED': 'info',
  };
  return typeMap[type] || 'info';
}

router.patch('/notifications/:id/read', async (req: Request & { user?: any }, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, receiverId: req.user.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/mark-all-read', async (req: Request & { user?: any }, res, next) => {
  try {
    await Notification.updateMany(
      { receiverId: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

router.delete('/notifications/:id', async (req: Request & { user?: any }, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      receiverId: req.user.userId,
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

// Helper function to determine priority from notification type
function getPriorityFromType(type: string): 'low' | 'medium' | 'high' | 'urgent' {
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
    approval: 'high',
    incident: 'urgent',
    meeting: 'medium',
    message: 'low',
    alert: 'high',
    info: 'low',
  };
  return priorityMap[type] || 'medium';
}

// Helper function to generate employee ID
function generateEmployeeId(prefix: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Get all operators with optional filters
router.get('/operators', async (req: Request, res) => {
  try {
    const { includeAssignments, locationId, status } = req.query;
    
    const query: any = {};
    if (locationId) query.locationId = locationId;
    
    let operatorsQuery = Operator.find(query)
      .populate('userId')
      .populate('locationId')
      .sort({ createdAt: -1 });

    const operators = await operatorsQuery.lean();
    
    // Filter out operators with null userId (invalid data)
    const validOperators = operators.filter((op: any) => {
      if (!op.userId) {
        console.warn('⚠️ Operator with null userId found:', op._id);
        return false;
      }
      return true;
    });

    // Fetch current assignments if requested
    if (includeAssignments === 'true') {
      const operatorIds = validOperators.map(op => op._id);
      const assignments = await GuardAssignment.find({
        operatorId: { $in: operatorIds },
        status: 'ACTIVE'
      })
        .populate('bitId')
        .populate('locationId')
        .populate('supervisorId')
        .populate({
          path: 'supervisorId',
          populate: { path: 'userId' }
        })
        .lean();

      // Map assignments to operators
      const assignmentMap = new Map();
      assignments.forEach(assignment => {
        assignmentMap.set(assignment.operatorId.toString(), assignment);
      });

      // Add currentAssignment to each operator
      validOperators.forEach((operator: any) => {
        operator.currentAssignment = assignmentMap.get(operator._id.toString()) || null;
      });
    }

    res.json({
      success: true,
      count: validOperators.length,
      operators: validOperators,
    });
  } catch (error: any) {
    console.error('Error fetching operators:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch operators',
    });
  }
});

// Director Register Operator (Director can register directly without approval)
router.post('/operators/register', async (req: Request & { user?: any }, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { sendOperatorWelcomeEmail } = require('../services/email.service');
    const { Location } = require('../models/Location.model');
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
      locationId,
      bitId,
      supervisorId,
      shiftType,
      guarantor1Name,
      guarantor1Phone,
      guarantor1Address,
      guarantor1Photo,
      guarantor2Name,
      guarantor2Phone,
      guarantor2Address,
      guarantor2Photo,
      previousExperience,
      medicalFitness,
      applicantPhoto,
      ninNumber,
      ninDocument,
    } = req.body;

    const directorUserId = req.user?.userId;
    const directorUser = await User.findById(directorUserId);

    console.log('🔷 Director registering operator:', {
      email,
      locationId,
      bitId,
      supervisorId,
      directorId: directorUserId,
    });

    // Validate guarantor photos if provided
    const validateBase64Image = (base64: string): boolean => {
      if (!base64) return true; // Optional field
      // Check if it's a valid data URL
      const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
      if (!base64Regex.test(base64)) return false;
      // Check size (max 3MB after base64 encoding - more lenient)
      const sizeInBytes = (base64.length * 3) / 4;
      const maxSize = 3 * 1024 * 1024; // 3MB
      return sizeInBytes <= maxSize;
    };

    // Validate all photo fields - only if they are provided
    if (applicantPhoto && !validateBase64Image(applicantPhoto)) {
      console.log('❌ Invalid applicant photo:', {
        length: applicantPhoto?.length,
        prefix: applicantPhoto?.substring(0, 50)
      });
      res.status(400).json({ error: 'Applicant photo is invalid or too large (max 3MB)' });
      return;
    }
    if (guarantor1Photo && !validateBase64Image(guarantor1Photo)) {
      console.log('❌ Invalid guarantor1 photo:', {
        length: guarantor1Photo?.length,
        prefix: guarantor1Photo?.substring(0, 50)
      });
      res.status(400).json({ error: 'Guarantor 1 photo is invalid or too large (max 3MB)' });
      return;
    }
    if (guarantor2Photo && !validateBase64Image(guarantor2Photo)) {
      console.log('❌ Invalid guarantor2 photo:', {
        length: guarantor2Photo?.length,
        prefix: guarantor2Photo?.substring(0, 50)
      });
      res.status(400).json({ error: 'Guarantor 2 photo is invalid or too large (max 3MB)' });
      return;
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'A user with this email already exists' });
      return;
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        res.status(400).json({ error: 'A user with this phone number already exists' });
        return;
      }
    }

    // Generate employee ID
    const employeeId = generateEmployeeId('OPR');

    // Generate temporary password
    const temporaryPassword = `Opr${Math.random().toString(36).substring(2, 10)}!`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user with ACTIVE status (Director approval not needed)
    const newUser = new User({
      email: email.toLowerCase(),
      phone: phone || undefined,
      passwordHash: hashedPassword,
      role: 'OPERATOR',
      status: 'ACTIVE', // Director can directly activate
      firstName,
      lastName,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address: address || undefined,
      state: state || undefined,
      lga: lga || undefined,
      employeeId,
      passportPhoto: applicantPhoto || undefined,
      accountName: `${firstName} ${lastName}`,
      createdById: directorUserId,
    });

    await newUser.save();

    // Create operator record
    const newOperator = new Operator({
      userId: newUser._id,
      employeeId,
      locationId: locationId || undefined,
      supervisorId: supervisorId || undefined,
      shiftType: shiftType || 'DAY',
      passportPhoto: applicantPhoto || undefined,
      nationalId: ninNumber || undefined,
      documents: ninDocument ? [ninDocument] : [],
      guarantors: [
        {
          name: guarantor1Name,
          phone: guarantor1Phone,
          address: guarantor1Address,
          photo: guarantor1Photo,
        },
        {
          name: guarantor2Name,
          phone: guarantor2Phone,
          address: guarantor2Address,
          photo: guarantor2Photo,
        },
      ],
      previousExperience: previousExperience || undefined,
      medicalFitness: medicalFitness || false,
      approvalStatus: 'APPROVED', // Director registration is auto-approved
      salary: 0, // Can be set later
      startDate: new Date(),
    });

    await newOperator.save();

    // Log what values we have for assignment
    console.log('📋 Assignment data check:', {
      hasBitId: !!bitId,
      hasLocationId: !!locationId,
      hasSupervisorId: !!supervisorId,
      bitIdValue: bitId,
      locationIdValue: locationId,
      supervisorIdValue: supervisorId,
    });

    // Create GuardAssignment if BIT, location, and supervisor are specified (not empty strings)
    let guardAssignment = null;
    if (bitId && bitId !== '' && locationId && locationId !== '' && supervisorId && supervisorId !== '') {
      try {
        console.log('🔹 Creating GuardAssignment for operator:', {
          operatorId: newOperator._id,
          bitId,
          locationId,
          supervisorId,
          shiftType,
        });

        guardAssignment = new GuardAssignment({
          operatorId: newOperator._id,
          bitId,
          locationId,
          supervisorId,
          assignmentType: 'PERMANENT',
          shiftType: shiftType || 'DAY',
          startDate: new Date(),
          status: 'ACTIVE',
          assignedBy: {
            userId: directorUserId,
            role: 'DIRECTOR',
            name: `${directorUser?.firstName || ''} ${directorUser?.lastName || ''}`.trim() || 'Director',
          },
          approvedBy: {
            userId: directorUserId,
            role: 'DIRECTOR',
            name: `${directorUser?.firstName || ''} ${directorUser?.lastName || ''}`.trim() || 'Director',
          },
          approvedAt: new Date(),
        });

        await guardAssignment.save();
        console.log('✅ GuardAssignment created successfully:', guardAssignment._id);
      } catch (assignmentError) {
        console.error('❌ Failed to create GuardAssignment:', assignmentError);
        // Don't fail the registration if assignment creation fails
        // The operator can be assigned later through the assignment page
      }
    } else if (bitId || supervisorId) {
      console.warn('⚠️ Partial assignment data provided:', {
        hasbitId: !!bitId,
        hasLocationId: !!locationId,
        hasSupervisorId: !!supervisorId,
      });
      console.warn('⚠️ GuardAssignment requires bitId, locationId, and supervisorId. Skipping assignment creation.');
    }

    // Get location details for SMS
    let locationName = 'Unassigned';
    if (locationId) {
      try {
        const location = await Location.findById(locationId);
        if (location) {
          locationName = location.locationName || location.name || 'Assigned Location';
        }
      } catch (error) {
        logger.warn('Could not fetch location details:', error);
      }
    }

    // Send welcome email (non-blocking)
    if (email) {
      logger.info('📧 Attempting to send welcome email to:', email);
      sendOperatorWelcomeEmail({
        email: email,
        firstName,
        lastName,
        employeeId,
        locationName,
        temporaryPassword,
      }).then(() => {
        logger.info('✅ Welcome email sent successfully to:', email);
      }).catch((error: any) => {
        logger.error('❌ Failed to send welcome email:', error);
        // Don't fail the request if email fails
      });
    }

    res.status(201).json({
      success: true,
      message: guardAssignment 
        ? 'Operator registered, activated, and assigned to BIT successfully.'
        : 'Operator registered and activated successfully.',
      operator: {
        id: newOperator._id,
        userId: newUser._id,
        fullName: `${firstName} ${lastName}`,
        email: newUser.email,
        phone: phone,
        employeeId,
        locationName,
        approvalStatus: 'APPROVED',
        status: 'ACTIVE',
        temporaryPassword, // Include for reference
        emailSent: true, // Email notification enabled
        assignmentCreated: !!guardAssignment,
        assignmentId: guardAssignment?._id,
      },
    });
  } catch (error) {
    console.error('Error registering operator:', error);
    next(error);
  }
});

export default router;
