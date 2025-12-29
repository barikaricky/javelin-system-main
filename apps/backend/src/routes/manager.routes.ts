import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/error.middleware';
import { Supervisor, Operator, Location, IncidentReport, Attendance, User, Secretary } from '../models';
import bcrypt from 'bcryptjs';
import { notifyDirectorsOfOperatorRegistration } from '../services/notification.service';
import {
  registerManager,
  checkEmailAvailability,
  getLocations,
  getManagerById,
  getAllManagers,
} from '../services/manager.service';
import { getSupervisorById } from '../services/supervisor.service';

const router = Router();

// Dashboard Stats - Real data from database
router.get('/dashboard/stats', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all stats in parallel using Mongoose
    const [
      totalGeneralSupervisors,
      totalSupervisors,
      totalOperators,
      totalLocations,
      openIncidents,
      todayAttendance,
      pendingApprovals,
      supervisorsList,
      locationsList,
      recentIncidents,
    ] = await Promise.all([
      // Total General Supervisors
      Supervisor.countDocuments({
        supervisorType: 'GENERAL_SUPERVISOR',
        approvalStatus: 'APPROVED',
      }),
      // Total Supervisors
      Supervisor.countDocuments({
        supervisorType: 'SUPERVISOR',
        approvalStatus: 'APPROVED',
      }),
      // Total Operators
      Operator.countDocuments(),
      // Total Active Locations
      Location.countDocuments({ isActive: true }),
      // Open Incidents
      IncidentReport.countDocuments({
        status: { $in: ['REPORTED', 'UNDER_REVIEW'] },
      }),
      // Today's Attendance
      Attendance.countDocuments({
        checkInTime: { $gte: today },
      }),
      // Pending Supervisor Approvals (supervisors registered by GS)
      Supervisor.countDocuments({
        approvalStatus: 'PENDING',
        supervisorType: 'SUPERVISOR',
      }),
      // Top Supervisors
      Supervisor.find({ approvalStatus: 'APPROVED' })
        .limit(10)
        .populate('userId', 'firstName lastName profilePhoto')
        .populate('locationId', 'name')
        .lean(),
      // Locations with status
      Location.find({ isActive: true })
        .limit(10)
        .lean(),
      // Recent Incidents
      IncidentReport.find({ status: { $in: ['REPORTED', 'UNDER_REVIEW'] } })
        .limit(5)
        .sort({ createdAt: -1 })
        .populate({
          path: 'operatorId',
          populate: { path: 'locationId', select: 'name' }
        })
        .lean(),
    ]);

    // Calculate attendance rate
    const attendanceRate = totalOperators > 0 ? Math.round((todayAttendance / totalOperators) * 100) : 0;

    // Map supervisors to expected format
    const mappedSupervisors = supervisorsList.map((sup: any) => ({
      id: sup._id,
      name: sup.userId ? `${sup.userId.firstName} ${sup.userId.lastName}` : 'Unknown',
      type: sup.supervisorType,
      rating: 4.5, // Placeholder
      operatorsCount: 0,
      location: sup.locationId?.name || 'Unassigned',
      profilePhoto: sup.userId?.profilePhoto,
    }));

    // Map locations to expected format
    const mappedLocations = locationsList.map((loc: any) => ({
      id: loc._id,
      name: loc.name,
      status: loc.isActive ? 'operational' : 'inactive',
      operatorsCount: 0,
      lastCheckin: loc.updatedAt,
    }));

    // Map incidents to expected format
    const mappedIncidents = recentIncidents.map((inc: any) => ({
      id: inc._id,
      type: inc.incidentType || 'Unknown',
      location: inc.operatorId?.locationId?.name || 'Unknown',
      severity: inc.severity || 'LOW',
      time: inc.createdAt,
      status: inc.status,
    }));

    res.json({
      stats: {
        totalGeneralSupervisors,
        totalSupervisors,
        totalOperators,
        totalLocations,
        openIncidents,
        todayAttendance,
        attendanceRate,
        pendingApprovals,
      },
      supervisors: mappedSupervisors,
      locations: mappedLocations,
      incidents: mappedIncidents,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// No multer needed - we accept base64 strings directly in request body

// Check email availability
router.get('/check-email', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      throw new AppError('Email is required', 400);
    }

    const available = await checkEmailAvailability(email);

    res.json({
      success: true,
      available,
      message: available ? 'Email is available' : 'Email is already registered',
    });
  } catch (error) {
    next(error);
  }
});

// Get locations for dropdown
router.get('/locations', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const locations = await getLocations();
    res.json({
      success: true,
      locations,
    });
  } catch (error) {
    next(error);
  }
});

// Register new manager
router.post(
  '/register',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Only directors can register managers
      if (req.user?.role !== 'DIRECTOR') {
        throw new AppError('Only directors can register managers', 403);
      }

      const { fullName, email, phone, department, locationId, startDate, profilePhoto } = req.body;

      // Validation
      if (!fullName || fullName.trim().length < 3) {
        throw new AppError('Full name must be at least 3 characters', 400);
      }

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError('Please enter a valid email address', 400);
      }

      if (!phone) {
        throw new AppError('Phone number is required', 400);
      }

      // Phone validation (at least 10 digits)
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        throw new AppError('Phone number must be at least 10 digits', 400);
      }

      // Full name validation (letters, spaces, hyphens, apostrophes only)
      const nameRegex = /^[a-zA-Z\s\-']+$/;
      if (!nameRegex.test(fullName)) {
        throw new AppError('Name can only contain letters, spaces, hyphens, and apostrophes', 400);
      }

      // Must have at least first and last name
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        throw new AppError('Please enter both first and last name', 400);
      }

      const result = await registerManager({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone,
        department,
        locationId: locationId || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        profilePhoto: profilePhoto || undefined, // Base64 string from frontend
        createdById: req.user.userId,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get all managers
router.get('/', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const managers = await getAllManagers();
    res.json({
      success: true,
      managers,
    });
  } catch (error) {
    next(error);
  }
});

// Get all operators
router.get('/operators', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    
    // Build query filter
    const query: any = {};
    if (status && status !== 'ALL') {
      // Map frontend status to user status
      query.status = status;
    }

    // Fetch operators with populated fields
    const operators = await Operator.find()
      .populate({
        path: 'userId',
        select: 'email phone firstName lastName status profilePhoto passportPhoto gender dateOfBirth state lga address createdAt',
      })
      .populate({
        path: 'locationId',
        select: 'name address',
      })
      .populate({
        path: 'supervisorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName',
        },
      })
      .lean();

    // Transform data to match frontend interface
    const transformedOperators = operators.map((op: any) => ({
      id: op._id.toString(),
      userId: op.userId?._id?.toString(),
      employeeId: op.employeeId,
      fullName: op.fullName,
      salary: op.salary,
      salaryCategory: op.salaryCategory,
      allowance: op.allowance,
      approvalStatus: op.approvalStatus,
      rejectionReason: op.rejectionReason,
      createdAt: op.createdAt,
      users: op.userId ? {
        id: op.userId._id?.toString(),
        email: op.userId.email,
        phone: op.userId.phone,
        firstName: op.userId.firstName,
        lastName: op.userId.lastName,
        status: op.userId.status,
        profilePhoto: op.userId.profilePhoto,
        passportPhoto: op.userId.passportPhoto,
        state: op.userId.state,
        lga: op.userId.lga,
        address: op.userId.address,
        gender: op.userId.gender,
        dateOfBirth: op.userId.dateOfBirth,
        createdAt: op.userId.createdAt,
      } : undefined,
      locations: op.locationId ? {
        id: op.locationId._id?.toString(),
        name: op.locationId.name,
        address: op.locationId.address,
      } : undefined,
      supervisor: op.supervisorId ? {
        id: op.supervisorId._id?.toString(),
        users: {
          firstName: op.supervisorId.userId?.firstName,
          lastName: op.supervisorId.userId?.lastName,
        },
      } : undefined,
    }));

    // Apply status filter if needed
    let filteredOperators = transformedOperators;
    if (status && status !== 'ALL') {
      filteredOperators = transformedOperators.filter((op: any) => 
        op.users?.status === status
      );
    }

    res.json({
      success: true,
      operators: filteredOperators,
      count: filteredOperators.length,
    });
  } catch (error) {
    console.error('Error fetching operators:', error);
    next(error);
  }
});

// Get operator statistics
router.get('/operators/stats', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalOperators, operators] = await Promise.all([
      Operator.countDocuments(),
      Operator.find().populate('userId', 'status').lean(),
    ]);

    // Count by status
    const activeCount = operators.filter((op: any) => op.userId?.status === 'ACTIVE').length;
    const pendingCount = operators.filter((op: any) => op.userId?.status === 'PENDING').length;
    const inactiveCount = operators.filter((op: any) => 
      op.userId?.status !== 'ACTIVE' && op.userId?.status !== 'PENDING'
    ).length;

    res.json({
      success: true,
      total: totalOperators,
      active: activeCount,
      pending: pendingCount,
      inactive: inactiveCount,
    });
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    next(error);
  }
});

// Get operator by ID
router.get('/operators/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const operator = await Operator.findById(id)
      .populate({
        path: 'userId',
        select: 'email phone firstName lastName status profilePhoto passportPhoto gender dateOfBirth state lga address createdAt',
      })
      .populate({
        path: 'locationId',
        select: 'name address',
      })
      .populate({
        path: 'supervisorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email',
        },
      })
      .lean();

    if (!operator) {
      throw new AppError('Operator not found', 404);
    }

    // Transform to match frontend interface
    const transformedOperator = {
      id: operator._id.toString(),
      userId: operator.userId?._id?.toString(),
      employeeId: operator.employeeId,
      fullName: operator.fullName,
      salary: operator.salary,
      salaryCategory: operator.salaryCategory,
      allowance: operator.allowance,
      approvalStatus: operator.approvalStatus,
      rejectionReason: operator.rejectionReason,
      createdAt: operator.createdAt,
      users: operator.userId ? {
        id: operator.userId._id?.toString(),
        email: operator.userId.email,
        phone: operator.userId.phone,
        firstName: operator.userId.firstName,
        lastName: operator.userId.lastName,
        status: operator.userId.status,
        profilePhoto: operator.userId.profilePhoto,
        passportPhoto: operator.userId.passportPhoto,
        state: operator.userId.state,
        lga: operator.userId.lga,
        address: operator.userId.address,
        gender: operator.userId.gender,
        dateOfBirth: operator.userId.dateOfBirth,
        createdAt: operator.userId.createdAt,
      } : undefined,
      locations: operator.locationId ? {
        id: operator.locationId._id?.toString(),
        name: operator.locationId.name,
        address: operator.locationId.address,
      } : undefined,
      supervisor: operator.supervisorId ? {
        id: operator.supervisorId._id?.toString(),
        users: {
          firstName: operator.supervisorId.userId?.firstName,
          lastName: operator.supervisorId.userId?.lastName,
          email: operator.supervisorId.userId?.email,
        },
      } : undefined,
    };

    res.json({
      success: true,
      operator: transformedOperator,
    });
  } catch (error) {
    console.error('Error fetching operator:', error);
    next(error);
  }
});

// Get all supervisors
router.get('/supervisors', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Fetch all supervisors
    const supervisors = await Supervisor.find()
      .populate({
        path: 'userId',
        select: 'email phone firstName lastName status profilePhoto passportPhoto gender dateOfBirth state lga address createdAt',
      })
      .populate({
        path: 'locationId',
        select: 'name address',
      })
      .lean();

    // Transform data to match frontend interface
    const transformedSupervisors = supervisors.map((sup: any) => ({
      id: sup._id.toString(),
      _id: sup._id.toString(),
      userId: sup.userId?._id?.toString(),
      employeeId: sup.employeeId,
      fullName: sup.fullName,
      supervisorType: sup.supervisorType,
      regionAssigned: sup.regionAssigned,
      users: sup.userId ? {
        id: sup.userId._id?.toString(),
        email: sup.userId.email,
        phone: sup.userId.phone,
        firstName: sup.userId.firstName,
        lastName: sup.userId.lastName,
        status: sup.userId.status,
        profilePhoto: sup.userId.profilePhoto,
        passportPhoto: sup.userId.passportPhoto,
        state: sup.userId.state,
        lga: sup.userId.lga,
        address: sup.userId.address,
        gender: sup.userId.gender,
        dateOfBirth: sup.userId.dateOfBirth,
        createdAt: sup.userId.createdAt,
      } : undefined,
      locations: sup.locationId ? {
        id: sup.locationId._id?.toString(),
        name: sup.locationId.name,
        address: sup.locationId.address,
      } : undefined,
    }));

    res.json({
      success: true,
      supervisors: transformedSupervisors,
      count: transformedSupervisors.length,
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    next(error);
  }
});

// Get manager by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const manager = await getManagerById(req.params.id);
    res.json({
      success: true,
      manager,
    });
  } catch (error) {
    next(error);
  }
});

// Get supervisor details by ID
router.get('/supervisors/:supervisorId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supervisorId } = req.params;
    
    const supervisor = await getSupervisorById(supervisorId);

    res.json({
      success: true,
      supervisor,
    });
  } catch (error) {
    next(error);
  }
});

// Get subordinate supervisors under a General Supervisor
router.get('/general-supervisor/:gsId/supervisors', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { gsId } = req.params;

    const supervisors = await Supervisor.find({ generalSupervisorId: gsId })
      .populate('userId', 'firstName lastName email phone status profilePhoto')
      .lean();

    // Get operator counts for each supervisor
    const supervisorsWithCounts = await Promise.all(
      supervisors.map(async (sup: any) => {
        const operatorCount = await Operator.countDocuments({ supervisorId: sup._id });
        return {
          ...sup,
          id: sup._id,
          operatorCount,
        };
      })
    );

    res.json({
      success: true,
      supervisors: supervisorsWithCounts,
    });
  } catch (error) {
    next(error);
  }
});

// Salary Panel - View all staff salaries
router.get('/salary-panel', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Fetch all staff with salary information
    const [generalSupervisors, supervisors, operators, secretaries] = await Promise.all([
      Supervisor.find({
        supervisorType: 'GENERAL_SUPERVISOR',
        approvalStatus: 'APPROVED',
      }).populate('userId', 'id firstName lastName email status').lean(),
      Supervisor.find({
        supervisorType: 'SUPERVISOR',
        approvalStatus: 'APPROVED',
      }).populate('userId', 'id firstName lastName email status').lean(),
      Operator.find().populate('userId', 'id firstName lastName email status').lean(),
      Secretary.find().populate('userId', 'id firstName lastName email status').lean(),
    ]);

    // Transform data into unified salary records
    const salaries: any[] = [];

    // General Supervisors
    generalSupervisors.forEach((gs: any) => {
      if (gs.salary) {
        salaries.push({
          id: gs._id,
          employeeId: gs.employeeId,
          fullName: gs.fullName,
          role: 'GENERAL_SUPERVISOR',
          salary: parseFloat(gs.salary.toString()),
          salaryCategory: gs.salaryCategory || 'N/A',
          bankName: gs.bankName || 'N/A',
          bankAccountNumber: gs.bankAccountNumber || 'N/A',
          status: gs.userId?.status,
          region: gs.regionAssigned,
          supervisorType: gs.supervisorType,
        });
      }
    });

    // Supervisors
    supervisors.forEach((sup: any) => {
      if (sup.salary) {
        salaries.push({
          id: sup._id,
          employeeId: sup.employeeId,
          fullName: sup.fullName,
          role: 'SUPERVISOR',
          salary: parseFloat(sup.salary.toString()),
          salaryCategory: sup.salaryCategory || 'N/A',
          bankName: sup.bankName || 'N/A',
          bankAccountNumber: sup.bankAccountNumber || 'N/A',
          status: sup.userId?.status,
          region: sup.regionAssigned,
          supervisorType: sup.supervisorType,
        });
      }
    });

    // Operators
    operators.forEach((op: any) => {
      if (op.salary) {
        salaries.push({
          id: op._id,
          employeeId: op.employeeId,
          fullName: op.fullName,
          role: 'OPERATOR',
          salary: parseFloat(op.salary.toString()),
          salaryCategory: op.salaryCategory || 'N/A',
          bankName: op.bankName || 'N/A',
          bankAccountNumber: op.bankAccountNumber || 'N/A',
          status: op.userId?.status,
        });
      }
    });

    // Secretaries
    secretaries.forEach((sec: any) => {
      if (sec.salary) {
        salaries.push({
          id: sec._id,
          employeeId: sec.employeeId,
          fullName: sec.fullName,
          role: 'SECRETARY',
          salary: parseFloat(sec.salary.toString()),
          salaryCategory: sec.salaryCategory || 'N/A',
          bankName: sec.bankName || 'N/A',
          bankAccountNumber: sec.bankAccountNumber || 'N/A',
          status: sec.userId?.status,
          region: sec.regionAssigned,
        });
      }
    });

    // Calculate statistics
    const totalEmployees = salaries.length;
    const totalMonthlySalary = salaries.reduce((sum, s) => sum + s.salary, 0);
    const totalAnnualSalary = totalMonthlySalary * 12;

    // Group by role
    const byRole = [
      {
        role: 'GENERAL_SUPERVISOR',
        count: salaries.filter((s) => s.role === 'GENERAL_SUPERVISOR').length,
        totalSalary: salaries
          .filter((s) => s.role === 'GENERAL_SUPERVISOR')
          .reduce((sum, s) => sum + s.salary, 0),
      },
      {
        role: 'SUPERVISOR',
        count: salaries.filter((s) => s.role === 'SUPERVISOR').length,
        totalSalary: salaries
          .filter((s) => s.role === 'SUPERVISOR')
          .reduce((sum, s) => sum + s.salary, 0),
      },
      {
        role: 'OPERATOR',
        count: salaries.filter((s) => s.role === 'OPERATOR').length,
        totalSalary: salaries
          .filter((s) => s.role === 'OPERATOR')
          .reduce((sum, s) => sum + s.salary, 0),
      },
      {
        role: 'SECRETARY',
        count: salaries.filter((s) => s.role === 'SECRETARY').length,
        totalSalary: salaries
          .filter((s) => s.role === 'SECRETARY')
          .reduce((sum, s) => sum + s.salary, 0),
      },
    ].filter((r) => r.count > 0); // Only include roles with employees

    res.json({
      salaries,
      stats: {
        totalEmployees,
        totalMonthlySalary,
        totalAnnualSalary,
        byRole,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate employee ID
function generateEmployeeId(prefix: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Manager Register Operator (requires Manager/Director approval)
router.post('/register-operator', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
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
      guarantor1Photo,
      guarantor2Name,
      guarantor2Phone,
      guarantor2Address,
      guarantor2Photo,
      previousExperience,
      medicalFitness,
      applicantPhoto,
      passportPhoto,
      leftThumb,
      rightThumb,
      ninNumber,
      ninDocument,
    } = req.body;

    const managerUserId = req.user?.userId;

    console.log('🔷 Manager registering operator:', {
      email,
      locationId,
      bitId,
      supervisorId,
      managerId: managerUserId,
    });

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Check if phone already exists
    const phoneToCheck = phoneNumber || phone;
    if (phoneToCheck) {
      const existingPhone = await User.findOne({ phoneNumber: phoneToCheck });
      if (existingPhone) {
        return res.status(400).json({ error: 'A user with this phone number already exists' });
      }
    }

    // Generate employee ID
    const employeeId = generateEmployeeId('OPR');

    // Generate temporary password
    const temporaryPassword = `Opr${Math.random().toString(36).substring(2, 10)}!`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user with PENDING status (requires approval)
    const newUser = new User({
      email: email.toLowerCase(),
      phoneNumber: phoneToCheck || undefined,
      passwordHash: hashedPassword,
      role: 'OPERATOR',
      status: 'PENDING',
      firstName,
      lastName,
      profilePhoto: applicantPhoto || passportPhoto,
    });

    await newUser.save();
    console.log('✅ User created for operator', { userId: newUser._id });

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
      guarantor1Photo,
      guarantor2Name,
      guarantor2Phone,
      guarantor2Address,
      guarantor2Photo,
      previousExperience,
      medicalFitness: medicalFitness || false,
      applicantPhoto,
      passportPhoto,
      leftThumb,
      rightThumb,
      ninNumber,
      ninDocument,
      approvalStatus: 'PENDING', // Registered by manager, requires Director approval
      registeredBy: managerUserId,
    });

    await newOperator.save();
    console.log('✅ Operator profile created', { operatorId: newOperator._id });

    // Notify directors about new operator registration
    await notifyDirectorsOfOperatorRegistration(newOperator._id.toString());

    res.status(201).json({
      message: 'Operator registered successfully. Awaiting Director approval.',
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
    console.error('❌ Error registering operator:', error);
    next(error);
  }
});

export default router;
