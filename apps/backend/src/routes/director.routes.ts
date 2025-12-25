import { Router, Request } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createSupervisor, getSupervisors, getSupervisorById, updateSupervisor, deleteSupervisor } from '../services/director.service';
import { body } from 'express-validator';
import { registerManager, getManagers } from '../controllers/director.controller';
import { validateRequest } from '../middleware/validation.middleware';
import multer from 'multer';
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
  Transaction
} from '../models';
import MoneyOut from '../models/MoneyOut.model';

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

    // Calculate understaffed locations (locations with less than 5 operators)
    const understaffedLocations = locationOperatorCounts.filter(loc => loc.count < 5).length;

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
      guardsOnDuty: todayAttendance,
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

router.get('/supervisors', async (_req, res, next) => {
  try {
    const supervisors = await getSupervisors();
    res.json(supervisors);
  } catch (error) {
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
      id: n._id.toString(),
      type: n.type,
      title: n.subject || 'Notification',
      message: n.message,
      read: n.isRead,
      timestamp: n.createdAt,
      priority: getPriorityFromType(n.type),
      actionUrl: n.actionUrl,
      metadata: n.metadata,
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    next(error);
  }
});

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

// Director Register Operator (Director can register directly without approval)
router.post('/operators/register', async (req: Request & { user?: any }, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
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

    console.log('🔷 Director registering operator:', {
      email,
      directorId: directorUserId,
    });

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

    res.status(201).json({
      success: true,
      message: 'Operator registered and activated successfully.',
      operator: {
        id: newOperator._id,
        userId: newUser._id,
        fullName: `${firstName} ${lastName}`,
        email: newUser.email,
        employeeId,
        approvalStatus: 'APPROVED',
        status: 'ACTIVE',
        temporaryPassword, // Include for reference
      },
    });
  } catch (error) {
    console.error('Error registering operator:', error);
    next(error);
  }
});

export default router;
