import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { User, Supervisor } from '../models';
import {
  registerSupervisor,
  getAllSupervisors,
  getSupervisorById,
  getGeneralSupervisors,
  getSupervisorsUnderGeneralSupervisor,
  assignSupervisorToGeneralSupervisor,
  getAvailableLocations,
  getSupervisorStats,
  getPendingSupervisorApprovals,
  approveSupervisor,
  rejectSupervisor,
  getApprovalStats,
} from '../services/supervisor.service';
import {
  notifyDirectorsOfGSRegistration,
  notifyDirectorsOfSupervisorRegistration,
  notifyDirectorsOfSupervisorApproval,
} from '../services/notification.service';

const router = Router();

// Public routes for fetching data (still need auth)
router.use(authenticate);

// Get supervisor statistics
router.get('/stats', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'), asyncHandler(async (req, res) => {
  const stats = await getSupervisorStats();
  res.json(stats);
}));

// Get all supervisors with full details (Admin view)
router.get('/all', authorize('ADMIN', 'DIRECTOR', 'MANAGER', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  try {
    const supervisors = await Supervisor.find()
      .select('employeeId userId locationId role salary startDate passportPhoto bankName bankAccount nationalId previousExperience medicalFitness approvalStatus createdAt')
      .populate('userId', 'firstName lastName email phone passportPhoto isActive')
      .populate('locationId', 'locationName city state address')
      .sort({ createdAt: -1 })
      .lean();

    res.json(supervisors);
  } catch (error: any) {
    logger.error('Error fetching all supervisors:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
}));

// Get approval statistics (Director and Manager)
router.get('/approval-stats', authorize('DIRECTOR', 'MANAGER', 'DEVELOPER'), asyncHandler(async (req, res) => {
  const stats = await getApprovalStats();
  res.json(stats);
}));

// Get pending supervisor approvals
// Director sees General Supervisors pending approval
// Manager sees Supervisors pending approval
router.get('/pending-approvals', authorize('DIRECTOR', 'MANAGER', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  const userRole = req.user.role;
  const pendingSupervisors = await getPendingSupervisorApprovals();
  
  // Filter based on role
  let filtered;
  if (userRole === 'MANAGER') {
    // Managers only see regular Supervisors (registered by General Supervisors)
    filtered = pendingSupervisors.filter(s => s.supervisorType === 'SUPERVISOR');
  } else {
    // Directors see General Supervisors (registered by Managers)
    filtered = pendingSupervisors.filter(s => s.supervisorType === 'GENERAL_SUPERVISOR');
  }
  
  res.json(filtered);
}));

// Approve supervisor
// Director approves General Supervisors
// Manager approves Supervisors
router.post('/:id/approve', authorize('DIRECTOR', 'MANAGER', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  const supervisorId = req.params.id;
  const userRole = req.user.role;
  
  // Verify the user has permission to approve this type
  const supervisor = await Supervisor.findById(supervisorId);
  
  if (!supervisor) {
    return res.status(404).json({ error: 'Supervisor not found' });
  }
  
  // Authorization check based on supervisor type
  if (userRole === 'MANAGER' && supervisor.supervisorType === 'GENERAL_SUPERVISOR') {
    return res.status(403).json({ 
      error: 'Managers cannot approve General Supervisors. Only Directors can approve General Supervisors.' 
    });
  }
  
  if (userRole !== 'DEVELOPER' && userRole === 'DIRECTOR' && supervisor.supervisorType === 'SUPERVISOR') {
    // Directors can also approve supervisors, but primarily managers do
    // Allow it but log
    logger.info('Director approving regular Supervisor', { supervisorId });
  }
  
  logger.info('Supervisor approval request', { 
    supervisorId,
    approverId: req.user.userId,
    approverRole: userRole,
    supervisorType: supervisor.supervisorType
  });
  
  const result = await approveSupervisor(supervisorId, req.user.userId);
  
  // Notify directors when Manager approves a Supervisor
  if (userRole === 'MANAGER' && supervisor.supervisorType === 'SUPERVISOR') {
    try {
      const managerUser = await User.findById(req.user.userId).select('firstName lastName');
      const managerName = managerUser ? `${managerUser.firstName} ${managerUser.lastName}` : 'Manager';
      
      await notifyDirectorsOfSupervisorApproval(
        req.user.userId,
        managerName,
        supervisor.fullName,
        true
      );
      logger.info('Directors notified of Supervisor approval');
    } catch (notifyError) {
      logger.error('Failed to notify directors:', notifyError);
    }
  }
  
  res.json({
    message: 'Supervisor approved successfully',
    supervisor: result.supervisor,
    credentials: result.credentials,
  });
}));

// Reject supervisor
// Director rejects General Supervisors
// Manager rejects Supervisors
router.post('/:id/reject', authorize('DIRECTOR', 'MANAGER', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  const { reason } = req.body;
  const supervisorId = req.params.id;
  const userRole = req.user.role;
  
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  
  // Verify the user has permission to reject this type
  const supervisor = await Supervisor.findById(supervisorId);
  
  if (!supervisor) {
    return res.status(404).json({ error: 'Supervisor not found' });
  }
  
  // Authorization check based on supervisor type
  if (userRole === 'MANAGER' && supervisor.supervisorType === 'GENERAL_SUPERVISOR') {
    return res.status(403).json({ 
      error: 'Managers cannot reject General Supervisors. Only Directors can reject General Supervisors.' 
    });
  }
  
  logger.info('Supervisor rejection request', { 
    supervisorId,
    rejecterId: req.user.userId,
    rejectorRole: userRole,
    reason 
  });
  
  const result = await rejectSupervisor(supervisorId, req.user.userId, reason);
  
  // Notify directors when Manager rejects a Supervisor
  if (userRole === 'MANAGER' && supervisor.supervisorType === 'SUPERVISOR') {
    try {
      const managerUser = await User.findById(req.user.userId).select('firstName lastName');
      const managerName = managerUser ? `${managerUser.firstName} ${managerUser.lastName}` : 'Manager';
      
      await notifyDirectorsOfSupervisorApproval(
        req.user.userId,
        managerName,
        supervisor.fullName,
        false,
        reason
      );
      logger.info('Directors notified of Supervisor rejection');
    } catch (notifyError) {
      logger.error('Failed to notify directors:', notifyError);
    }
  }
  
  res.json({
    message: 'Supervisor rejected',
    supervisor: result,
  });
}));

// Get all general supervisors (for dropdown)
router.get('/general-supervisors', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'), asyncHandler(async (req, res) => {
  const generalSupervisors = await getGeneralSupervisors();
  res.json(generalSupervisors);
}));

// Get available locations for assignment
router.get('/locations', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER', 'SUPERVISOR', 'GENERAL_SUPERVISOR'), asyncHandler(async (req, res) => {
  const locations = await getAvailableLocations();
  res.json(locations);
}));

// Get all BEATs for reports
router.get('/beats', authorize('SUPERVISOR', 'GENERAL_SUPERVISOR'), asyncHandler(async (req, res) => {
  const { Beat } = require('../models');
  const beats = await Beat.find({ isActive: true })
    .select('beatName beatCode isActive')
    .sort({ beatName: 1 })
    .lean();
  res.json({ beats });
}));

// Get all supervisors with optional filters
router.get('/', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER', 'SECRETARY'), asyncHandler(async (req, res) => {
  const { supervisorType, regionAssigned, generalSupervisorId, status, approvalStatus } = req.query;
  
  const supervisors = await getAllSupervisors({
    supervisorType: supervisorType as any,
    regionAssigned: regionAssigned as string,
    generalSupervisorId: generalSupervisorId as string,
    status: status as any,
    approvalStatus: approvalStatus as any,
  });
  
  res.json(supervisors);
}));

// Get supervisor's own profile data (MUST be before /:id route)
router.get('/my-profile', authorize('SUPERVISOR', 'GENERAL_SUPERVISOR'), asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  
  try {
    const supervisor = await Supervisor.findOne({ userId })
      .populate('userId', 'firstName lastName email phone phoneNumber profilePhoto passportPhoto')
      .populate('locationId', 'name address city state')
      .populate('generalSupervisorId', 'firstName lastName email')
      .lean();
    
    if (!supervisor) {
      return res.status(404).json({ error: 'Supervisor profile not found' });
    }
    
    // Extract user data from populated field
    const user = supervisor.userId as any;
    
    res.json({
      supervisor,
      employeeId: supervisor.employeeId || '',
      profilePhoto: user?.profilePhoto || user?.passportPhoto || supervisor.passportPhoto || null,
      phone: supervisor.phone || user?.phone || user?.phoneNumber || '',
      phoneNumber: supervisor.phoneNumber || user?.phoneNumber || user?.phone || '',
      address: supervisor.address || user?.address || '',
    });
  } catch (error) {
    console.error('Error fetching supervisor profile:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor profile' });
  }
}));

// Get supervisor by ID
router.get('/:id', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER', 'SUPERVISOR', 'GENERAL_SUPERVISOR'), asyncHandler(async (req, res) => {
  const supervisor = await getSupervisorById(req.params.id);
  res.json(supervisor);
}));

// Get supervisors under a general supervisor
router.get('/under/:generalSupervisorId', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER', 'GENERAL_SUPERVISOR'), asyncHandler(async (req, res) => {
  const supervisors = await getSupervisorsUnderGeneralSupervisor(req.params.generalSupervisorId);
  res.json(supervisors);
}));

// Register General Supervisor (Manager only - cannot register Supervisors)
router.post('/register', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  // Enforce: Manager can ONLY register General Supervisors
  if (req.body.supervisorType !== 'GENERAL_SUPERVISOR') {
    return res.status(403).json({ 
      error: 'Managers can only register General Supervisors. Supervisors must be registered by General Supervisors.' 
    });
  }
  
  logger.info('General Supervisor registration request by Manager', { 
    body: { ...req.body, passportPhoto: req.body.passportPhoto ? '[PHOTO]' : null },
    managerId: req.user.userId 
  });
  
  const result = await registerSupervisor(req.body, req.user.userId);
  
  // Notify all Directors of this registration
  try {
    const managerUser = await User.findById(req.user.userId).select('firstName lastName');
    const managerName = managerUser ? `${managerUser.firstName} ${managerUser.lastName}` : 'Manager';
    
    await notifyDirectorsOfGSRegistration(
      req.user.userId,
      managerName,
      result.supervisor.fullName,
      result.user.email
    );
    logger.info('Directors notified of GS registration');
  } catch (notifyError) {
    logger.error('Failed to notify directors:', notifyError);
    // Don't fail the registration if notification fails
  }
  
  res.status(201).json({
    message: 'General Supervisor registered successfully. Awaiting Director approval.',
    supervisor: {
      id: result.supervisor._id,
      userId: result.user._id,
      fullName: result.supervisor.fullName,
      supervisorType: result.supervisor.supervisorType,
      approvalStatus: 'PENDING',
    },
    credentials: result.credentials,
  });
}));

// Register Supervisor (General Supervisor only)
router.post('/register-supervisor', authorize('GENERAL_SUPERVISOR', 'DEVELOPER'), asyncHandler(async (req: any, res) => {
  // Enforce: General Supervisor can ONLY register regular Supervisors
  if (req.body.supervisorType && req.body.supervisorType !== 'SUPERVISOR') {
    return res.status(403).json({ 
      error: 'General Supervisors can only register Supervisors.' 
    });
  }
  
  // Force supervisorType to SUPERVISOR
  req.body.supervisorType = 'SUPERVISOR';
  
  // Get the General Supervisor's ID to auto-assign
  const gs = await Supervisor.findOne({
    userId: req.user.userId,
    supervisorType: 'GENERAL_SUPERVISOR',
    approvalStatus: 'APPROVED', // Only approved GS can register supervisors
  }).populate('userId', 'firstName lastName');
  
  if (!gs) {
    return res.status(404).json({ 
      error: 'General Supervisor profile not found or not yet approved. Only approved General Supervisors can register Supervisors.' 
    });
  }
  
  // Auto-assign this supervisor to the registering General Supervisor
  req.body.generalSupervisorId = gs._id;
  
  logger.info('Supervisor registration request by General Supervisor', { 
    body: { ...req.body, passportPhoto: req.body.passportPhoto ? '[PHOTO]' : null },
    generalSupervisorId: gs._id,
    registeredBy: req.user.userId
  });
  
  const result = await registerSupervisor(req.body, req.user.userId);
  
  // Notify all Directors of this registration
  try {
    const gsName = `${gs.users.firstName} ${gs.users.lastName}`;
    
    await notifyDirectorsOfSupervisorRegistration(
      req.user.userId,
      gsName,
      result.supervisor.fullName,
      result.user.email
    );
    logger.info('Directors notified of Supervisor registration');
  } catch (notifyError) {
    logger.error('Failed to notify directors:', notifyError);
    // Don't fail the registration if notification fails
  }
  
  res.status(201).json({
    message: 'Supervisor registered successfully. Awaiting Manager approval.',
    supervisor: {
      id: result.supervisor.id,
      userId: result.user.id,
      fullName: result.supervisor.fullName,
      supervisorType: result.supervisor.supervisorType,
      approvalStatus: 'PENDING',
      generalSupervisorId: gs.id,
    },
    credentials: result.credentials,
  });
}));

// Assign supervisor to general supervisor
router.patch('/:id/assign', authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'), asyncHandler(async (req, res) => {
  const { generalSupervisorId } = req.body;
  
  const result = await assignSupervisorToGeneralSupervisor(
    req.params.id,
    generalSupervisorId
  );
  
  res.json({
    message: 'Supervisor assignment updated',
    supervisor: result,
  });
}));

// Supervisor dashboard (for supervisor users)
router.get('/dashboard', authorize('SUPERVISOR', 'GENERAL_SUPERVISOR'), asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Get the supervisor record
    const supervisor = await Supervisor.findOne({ userId }).lean();
    
    if (!supervisor) {
      return res.json({
        stats: {
          myOperators: 0,
          presentToday: 0,
          attendanceRate: 0,
          myBits: 0,
          openIncidents: 0,
          pendingTasks: 0,
        },
        operators: [],
        locations: [],
        incidents: [],
      });
    }

    const { Operator, Beat, Location, Attendance, IncidentReport } = require('../models');

    // Get all operators under this supervisor
    const operators = await Operator.find({ supervisorId: supervisor._id })
      .populate('userId', 'firstName lastName profilePhoto phone')
      .populate('locationId', 'locationName')
      .limit(10)
      .lean();

    const operatorIds = operators.map(op => op._id);

    // Get today's attendance
    const attendanceRecords = await Attendance.find({
      checkInTime: { $gte: today },
      operatorId: { $in: operatorIds },
    }).lean();

    const presentOperatorIds = new Set(attendanceRecords.map(att => att.operatorId.toString()));

    // Get beats/locations assigned
    const beats = await Beat.find({ 
      $or: [
        { supervisorId: supervisor._id },
        { locationId: supervisor.locationId }
      ]
    })
    .populate('locationId', 'locationName city state')
    .lean();

    // Get open incidents
    const openIncidents = await IncidentReport.find({
      supervisorId: supervisor._id,
      status: { $in: ['REPORTED', 'UNDER_REVIEW'] },
    })
    .populate({
      path: 'operatorId',
      populate: [
        { path: 'userId', select: 'firstName lastName' },
        { path: 'locationId', select: 'locationName' },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    // Calculate stats
    const myOperators = operators.length;
    const presentToday = presentOperatorIds.size;
    const attendanceRate = myOperators > 0 ? Math.round((presentToday / myOperators) * 100) : 0;
    const myBits = beats.length;
    const openIncidentsCount = await IncidentReport.countDocuments({
      supervisorId: supervisor._id,
      status: { $in: ['REPORTED', 'UNDER_REVIEW'] },
    });

    // Format operators data
    const formattedOperators = operators.map((op: any) => {
      const isPresent = presentOperatorIds.has(op._id.toString());
      const attendance = attendanceRecords.find(att => att.operatorId.toString() === op._id.toString());
      
      return {
        id: op._id,
        name: `${op.userId?.firstName || ''} ${op.userId?.lastName || ''}`.trim() || 'N/A',
        photo: op.userId?.profilePhoto,
        location: op.locationId?.locationName || 'N/A',
        status: isPresent ? 'present' : 'absent',
        checkInTime: attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
      };
    });

    // Format locations data
    const locationsWithStats = await Promise.all(
      beats.map(async (bit: any) => {
        const bitOperators = await Operator.countDocuments({
          locationId: bit.locationId?._id,
        });
        
        const bitPresent = await Attendance.countDocuments({
          checkInTime: { $gte: today },
          operatorId: { $in: await Operator.find({ locationId: bit.locationId?._id }).distinct('_id') },
        });

        const percentage = bitOperators > 0 ? (bitPresent / bitOperators) * 100 : 0;
        let status: 'green' | 'yellow' | 'red' = 'green';
        if (percentage < 50) status = 'red';
        else if (percentage < 80) status = 'yellow';

        return {
          id: bit._id,
          name: bit.locationId?.locationName || bit.beatName || 'N/A',
          operatorsAssigned: bitOperators,
          operatorsPresent: bitPresent,
          status,
        };
      })
    );

    // Format incidents data
    const formattedIncidents = openIncidents.map((inc: any) => ({
      id: inc._id,
      title: inc.title || 'Incident',
      location: inc.operatorId?.locationId?.locationName || 'N/A',
      severity: inc.severity?.toLowerCase() || 'medium',
      time: formatRelativeTime(new Date(inc.createdAt)),
      status: inc.status === 'REPORTED' ? 'open' : 'investigating',
    }));

    // Respond with dashboard data
    res.json({
      stats: {
        myOperators,
        presentToday,
        attendanceRate,
        myBits,
        openIncidents: openIncidentsCount,
        pendingTasks: openIncidentsCount,
      },
      operators: formattedOperators,
      locations: locationsWithStats.slice(0, 10),
      incidents: formattedIncidents,
    });
  } catch (error) {
    logger.error('Supervisor dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}));

// Helper function
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default router;
