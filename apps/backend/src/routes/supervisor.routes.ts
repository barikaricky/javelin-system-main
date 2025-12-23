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
router.get('/dashboard', authorize('SUPERVISOR', 'GENERAL_SUPERVISOR'), (req, res) => {
  res.json({ message: 'Supervisor dashboard' });
});

export default router;
