import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { User, Supervisor, Operator, Location, Attendance, IncidentReport } from '../models';

// Local enum type
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

const router = Router();

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

// All routes require authentication and GENERAL_SUPERVISOR role (DIRECTOR can also access)
router.use(authenticate);
router.use(authorize('GENERAL_SUPERVISOR', 'DIRECTOR', 'DEVELOPER'));

// Get General Supervisor's dashboard data
router.get('/dashboard', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the GS's supervisor record
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    // Return empty data if no GS profile found
    return res.json({
      stats: {
        supervisorsUnderMe: 0,
        totalOperators: 0,
        activeBits: 0,
        todayAttendance: 0,
        attendanceRate: 0,
        openIncidents: 0,
        pendingIssues: 0,
        locationsUnderMe: 0,
      },
      supervisors: [],
      incidents: [],
      locations: [],
    });
  }

  // Import required models
  const { Operator, Location, Attendance, IncidentReport } = require('../models');
  
  // Get subordinate supervisors with fallback
  let subordinateSupervisors = await Supervisor.countDocuments({
    generalSupervisorId: gs._id,
    approvalStatus: 'APPROVED',
  });

  // Get supervisors under this GS with fallback
  let supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
    approvalStatus: 'APPROVED',
  }).limit(10).lean();

  // Fallback: If no supervisors found with generalSupervisorId, show all SUPERVISOR type
  if (supervisors.length === 0) {
    console.log('⚠️ Dashboard: No supervisors with generalSupervisorId, fetching all SUPERVISOR type as fallback');
    supervisors = await Supervisor.find({
      supervisorType: 'SUPERVISOR',
      approvalStatus: 'APPROVED',
    }).limit(10).lean();
    subordinateSupervisors = await Supervisor.countDocuments({
      supervisorType: 'SUPERVISOR',
      approvalStatus: 'APPROVED',
    });
  }

  const supervisorIds = supervisors.map(s => s._id);
  
  // IMPORTANT: Also include the GS themselves in the supervisor IDs
  // because operators can be registered directly by the GS
  supervisorIds.push(gs._id);
  console.log(`📊 Dashboard: Checking operators under ${supervisorIds.length} supervisors (including GS)`);

  // Get all stats and data in parallel
  const [
    totalOperators,
    activeLocations,
    todayAttendance,
    openIncidents,
    supervisorsList,
    incidentsList,
    locationsList,
  ] = await Promise.all([
    // Total operators under supervisors who report to this GS
    Operator.countDocuments({ supervisorId: { $in: supervisorIds } }),
    // Active locations
    Location.countDocuments({ isActive: true }),
    // Today's attendance
    Attendance.countDocuments({
      checkInTime: { $gte: today },
      operatorId: { $in: await Operator.find({ supervisorId: { $in: supervisorIds } }).distinct('_id') },
    }),
    // Open incidents
    IncidentReport.countDocuments({
      status: { $in: ['REPORTED', 'UNDER_REVIEW'] },
      supervisorId: { $in: supervisorIds },
    }),
    // Supervisors list with populated data
    Supervisor.find({
      generalSupervisorId: gs._id,
      approvalStatus: 'APPROVED',
    })
    .limit(10)
    .populate('userId', 'firstName lastName profilePhoto status lastLogin')
    .populate('locationId', 'name')
    .lean(),
    // Recent incidents
    IncidentReport.find({
      status: { $in: ['REPORTED', 'UNDER_REVIEW'] },
      supervisorId: { $in: supervisorIds },
    })
    .limit(5)
    .sort({ createdAt: -1 })
    .populate({
      path: 'operatorId',
      populate: [
        { path: 'userId', select: 'firstName lastName' },
        { path: 'locationId', select: 'name' },
      ],
    })
    .lean(),
    // Locations
    Location.find({ isActive: true })
    .limit(10)
    .lean(),
  ]);

  // Calculate attendance rate
  const attendanceRate = totalOperators > 0 ? Math.round((todayAttendance / totalOperators) * 100) : 0;

  // Get operator counts for each supervisor
  const supervisorsWithCounts = await Promise.all(
    supervisorsList.map(async (sup: any) => {
      const operatorCount = await Operator.countDocuments({ supervisorId: sup._id });
      return { ...sup, operatorCount };
    })
  );

  // Map supervisors to expected format
  const mappedSupervisors = supervisorsWithCounts.map((sup: any) => {
    const lastLogin = sup.userId?.lastLogin;
    let status: 'active' | 'on-leave' | 'offline' = 'offline';
    if (sup.userId?.status === 'ACTIVE') {
      if (lastLogin && (new Date().getTime() - new Date(lastLogin).getTime()) < 3600000) {
        status = 'active';
      }
    } else if (sup.userId?.status === 'ON_LEAVE') {
      status = 'on-leave';
    }

    return {
      id: sup._id,
      name: `${sup.userId?.firstName || ''} ${sup.userId?.lastName || ''}`,
      photo: sup.userId?.profilePhoto || undefined,
      locationsCount: sup.locationsAssigned?.length || 0,
      operatorsCount: sup.operatorCount,
      status,
      lastActivity: lastLogin ? getRelativeTime(new Date(lastLogin)) : 'Never',
      performance: 90, // Default performance score
    };
  });

  // Map incidents to expected format
  const mappedIncidents = incidentsList.map((inc: any) => ({
    id: inc._id,
    title: inc.title,
    location: inc.operatorId?.locationId?.name || 'Unknown',
    reportedBy: inc.operatorId?.userId ? `Op. ${inc.operatorId.userId.firstName}` : 'Unknown',
    severity: inc.severity.toLowerCase() as 'high' | 'medium' | 'low',
    time: getRelativeTime(new Date(inc.createdAt)),
    status: inc.status === 'REPORTED' ? 'open' : inc.status === 'UNDER_REVIEW' ? 'investigating' : 'resolved' as 'open' | 'investigating' | 'resolved',
  }));

  // Get location supervisors and operators counts
  const locationsWithDetails = await Promise.all(
    locationsList.map(async (loc: any) => {
      const locationSupervisors = await Supervisor.find({
        locationId: loc._id,
        generalSupervisorId: gs._id,
      }).populate('userId', 'firstName lastName').lean();
      
      const operatorCount = await Operator.countDocuments({ locationId: loc._id });
      
      return {
        ...loc,
        supervisors: locationSupervisors,
        operatorCount,
      };
    })
  );

  // Map locations to expected format
  const mappedLocations = locationsWithDetails
    .filter((loc: any) => loc.supervisors.length > 0)
    .map((loc: any) => ({
      id: loc._id,
      name: loc.name,
      supervisor: loc.supervisors[0]?.userId ? `${loc.supervisors[0].userId.firstName} ${loc.supervisors[0].userId.lastName}` : 'Unassigned',
      operatorsAssigned: 10, // Default
      operatorsPresent: loc.operatorCount,
      status: loc.operatorCount >= 8 ? 'green' : loc.operatorCount >= 5 ? 'yellow' : 'red' as 'green' | 'yellow' | 'red',
    }));

  res.json({
    profile: gs,
    stats: {
      supervisorsUnderMe: subordinateSupervisors,
      totalOperators,
      activeBits: activeLocations,
      todayAttendance,
      attendanceRate,
      openIncidents,
      pendingIssues: 0, // Would need separate tracking
      locationsUnderMe: mappedLocations.length,
    },
    supervisors: mappedSupervisors,
    incidents: mappedIncidents,
    locations: mappedLocations,
  });
}));

// Get supervisors under this General Supervisor
router.get('/my-supervisors', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;
  
  let supervisors;
  
  // If DIRECTOR, they can view all supervisors  
  if (userRole === 'DIRECTOR') {
    supervisors = await Supervisor.find({
      supervisorType: 'SUPERVISOR',
    })
    .populate('userId', 'email phone firstName lastName status profilePhoto passportPhoto')
    .populate('locationId', 'name address')
    .sort({ createdAt: -1 });
    
    // Get operator counts for each supervisor
    const { Operator } = require('../models');
    const supervisorsWithCounts = await Promise.all(
      supervisors.map(async (sup) => {
        const operatorCount = await Operator.countDocuments({ supervisorId: sup._id });
        return {
          id: sup._id,
          ...sup.toObject(),
          users: sup.userId,
          locations: sup.locationId,
          _count: { operators: operatorCount },
          operatorCount,
        };
      })
    );
    
    return res.json(supervisorsWithCounts);
  }
  
  // For GENERAL_SUPERVISOR, find their own profile
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  });

  if (!gs) {
    console.log('❌ No General Supervisor profile found for userId:', userId);
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  console.log('✅ Found General Supervisor:', gs._id);

  // Get supervisors under this General Supervisor
  supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
    supervisorType: 'SUPERVISOR',
  })
  .populate('userId', 'email phone firstName lastName status profilePhoto passportPhoto lastLogin')
  .populate('locationId', 'name address')
  .sort({ createdAt: -1 });

  console.log(`📊 Found ${supervisors.length} supervisors under GS ${gs._id}`);

  // If no supervisors found with generalSupervisorId, try to get all supervisors (fallback for testing)
  if (supervisors.length === 0 && userRole === 'GENERAL_SUPERVISOR') {
    console.log('⚠️ No supervisors with generalSupervisorId, fetching all SUPERVISOR type as fallback');
    supervisors = await Supervisor.find({
      supervisorType: 'SUPERVISOR',
    })
    .populate('userId', 'email phone firstName lastName status profilePhoto passportPhoto lastLogin')
    .populate('locationId', 'name address')
    .sort({ createdAt: -1 });
    console.log(`📊 Fallback: Found ${supervisors.length} total supervisors`);
  }

  // Get operator counts for each supervisor
  const { Operator } = require('../models');
  const supervisorsWithCounts = await Promise.all(
    supervisors.map(async (sup) => {
      const operatorCount = await Operator.countDocuments({ supervisorId: sup._id });
      return {
        id: sup._id,
        ...sup.toObject(),
        users: sup.userId,
        locations: sup.locationId,
        _count: { operators: operatorCount },
        operatorCount,
      };
    })
  );

  res.json(supervisorsWithCounts);
}));

// Get a specific supervisor's details
router.get('/my-supervisors/:supervisorId', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;
  const { supervisorId } = req.params;
  const mongoose = require('mongoose');
  
  console.log(`🔍 GET /my-supervisors/${supervisorId} - User: ${userId}, Role: ${userRole}`);
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
    console.log(`❌ Invalid ObjectId format: ${supervisorId}`);
    return res.status(400).json({ error: 'Invalid supervisor ID format' });
  }
  
  // If DIRECTOR, they can view any supervisor
  if (userRole === 'DIRECTOR') {
    const supervisor = await Supervisor.findById(supervisorId)
      .populate('userId', 'email phone firstName lastName status profilePhoto passportPhoto gender dateOfBirth state lga lastLogin')
      .populate('locationId', 'name address state lga')
      .lean();

    if (!supervisor) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    // Get operator count and list
    const { Operator } = require('../models');
    const operators = await Operator.find({ supervisorId: supervisor._id })
      .populate('userId', 'firstName lastName email status profilePhoto')
      .populate('locationId', 'name')
      .lean();

    // Get incident count
    const { IncidentReport } = require('../models');
    const incidentCount = await IncidentReport.countDocuments({ supervisorId: supervisor._id });

    const response = {
      id: supervisor._id,
      ...supervisor,
      users: supervisor.userId,
      locations: supervisor.locationId,
      operators: operators.map((op: any) => ({
        id: op._id,
        ...op,
        users: op.userId,
        locations: op.locationId,
      })),
      _count: {
        operators: operators.length,
        incident_reports: incidentCount,
      },
    };

    return res.json(response);
  }
  
  // For GENERAL_SUPERVISOR, verify ownership
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Try to find supervisor with generalSupervisorId first
  let supervisor = await Supervisor.findOne({
    _id: supervisorId,
    generalSupervisorId: gs._id,
  })
  .populate('userId', 'email phone firstName lastName status profilePhoto passportPhoto gender dateOfBirth state lga lastLogin')
  .populate('locationId', 'name address state lga')
  .lean();

  // Fallback: If not found, check if supervisor exists at all (for development/testing)
  if (!supervisor) {
    console.log(`⚠️ Supervisor ${supervisorId} not linked to GS ${gs._id}, checking if supervisor exists...`);
    supervisor = await Supervisor.findOne({
      _id: supervisorId,
      supervisorType: 'SUPERVISOR',
    })
    .populate('userId', 'email phone firstName lastName status profilePhoto passportPhoto gender dateOfBirth state lga lastLogin')
    .populate('locationId', 'name address state lga')
    .lean();
    
    if (supervisor) {
      console.log(`✅ Found supervisor ${supervisorId} without generalSupervisorId (fallback mode)`);
    }
  }

  if (!supervisor) {
    return res.status(404).json({ error: 'Supervisor not found or not under your supervision' });
  }

  // Get operator count and list
  const { Operator } = require('../models');
  const operators = await Operator.find({ supervisorId: supervisor._id })
    .populate('userId', 'firstName lastName email status profilePhoto')
    .populate('locationId', 'name')
    .lean();

  // Get incident count
  const { IncidentReport } = require('../models');
  const incidentCount = await IncidentReport.countDocuments({ supervisorId: supervisor._id });

  const response = {
    id: supervisor._id,
    ...supervisor,
    users: supervisor.userId,
    locations: supervisor.locationId,
    operators: operators.map((op: any) => ({
      id: op._id,
      ...op,
      users: op.userId,
      locations: op.locationId,
    })),
    _count: {
      operators: operators.length,
      incident_reports: incidentCount,
    },
  };

  res.json(response);
}));

// Get subordinate supervisors (for assignment dropdowns, etc.)
// Similar to director's /supervisors endpoint but filtered to GS's subordinates
router.get('/subordinates', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;
  const { limit, approvalStatus } = req.query;
  
  console.log('🔍 GET /subordinates - User:', userId, 'Role:', userRole);
  
  let supervisors;
  
  // If DIRECTOR, return all supervisors
  if (userRole === 'DIRECTOR' || userRole === 'DEVELOPER') {
    const query: any = { supervisorType: 'SUPERVISOR' };
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    
    supervisors = await Supervisor.find(query)
      .populate('userId', 'email phone firstName lastName status')
      .populate('locationId', 'name locationName address')
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit as string) : 500)
      .lean();
      
    console.log(`✅ DIRECTOR: Found ${supervisors.length} supervisors`);
    return res.json({ supervisors });
  }
  
  // For GENERAL_SUPERVISOR, find their profile
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    console.log('❌ No General Supervisor profile found');
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  console.log('✅ Found GS:', gs._id);

  // Get supervisors under this GS
  const query: any = {
    generalSupervisorId: gs._id,
    supervisorType: 'SUPERVISOR',
  };
  
  if (approvalStatus) {
    query.approvalStatus = approvalStatus;
  }

  supervisors = await Supervisor.find(query)
    .populate('userId', 'email phone firstName lastName status')
    .populate('locationId', 'name locationName address')
    .sort({ createdAt: -1 })
    .limit(limit ? parseInt(limit as string) : 500)
    .lean();

  console.log(`📊 Found ${supervisors.length} supervisors under GS ${gs._id}`);

  // Fallback: If no supervisors found, return all approved supervisors
  if (supervisors.length === 0) {
    console.log('⚠️ No supervisors with generalSupervisorId, using fallback');
    const fallbackQuery: any = {
      supervisorType: 'SUPERVISOR',
      approvalStatus: 'APPROVED',
    };
    
    supervisors = await Supervisor.find(fallbackQuery)
      .populate('userId', 'email phone firstName lastName status')
      .populate('locationId', 'name locationName address')
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit as string) : 500)
      .lean();
      
    console.log(`📊 Fallback: Found ${supervisors.length} supervisors`);
  }

  res.json({ supervisors });
}));

// Assign/Update supervisor location
router.patch('/supervisors/:id/location', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { id: supervisorId } = req.params;
  const { locationId } = req.body;
  
  console.log('🔄 PATCH /supervisors/:id/location - GS:', userId, 'Supervisor:', supervisorId, 'Location:', locationId);
  
  // Verify GS exists
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Verify the supervisor is under this GS
  let supervisor = await Supervisor.findOne({
    _id: supervisorId,
    generalSupervisorId: gs._id,
  });

  // Fallback for testing - allow if supervisor exists
  if (!supervisor) {
    console.log('⚠️ Supervisor not linked to GS, checking if supervisor exists...');
    supervisor = await Supervisor.findOne({
      _id: supervisorId,
      supervisorType: 'SUPERVISOR',
    });
  }

  if (!supervisor) {
    return res.status(404).json({ error: 'Supervisor not found or not under your supervision' });
  }

  // Validate location exists
  if (locationId) {
    const { Location } = require('../models');
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
  }

  // Update supervisor location
  supervisor.locationId = locationId || null;
  await supervisor.save();

  // Reload with populated data
  const updatedSupervisor = await Supervisor.findById(supervisorId)
    .populate('userId', 'email phone firstName lastName status')
    .populate('locationId', 'name locationName address')
    .lean();

  console.log('✅ Updated supervisor location');
  res.json({ 
    message: 'Supervisor location updated successfully',
    supervisor: updatedSupervisor 
  });
}));

// Get single operator details - MUST come before /operators route
router.get('/operators/:id', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  
  console.log('🔍 Fetching operator details for ID:', id);
  
  // Verify GS exists
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    console.log('❌ GS not found');
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Find supervisors under this GS (including fallback)
  let supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
  }).select('_id').lean();

  if (supervisors.length === 0) {
    console.log('⚠️ Using fallback for supervisors');
    supervisors = await Supervisor.find({
      supervisorType: 'SUPERVISOR',
      approvalStatus: 'APPROVED',
    }).select('_id').lean();
  }

  const supervisorIds = supervisors.map(s => s._id);
  supervisorIds.push(gs._id); // Include GS
  
  console.log('📋 Checking operator under supervisorIds:', supervisorIds);

  // Fetch the operator with all details
  const operator = await Operator.findOne({
    _id: id,
    supervisorId: { $in: supervisorIds }
  })
    .populate('userId', 'firstName lastName email phone profilePhoto status createdAt')
    .populate({
      path: 'supervisorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .populate('locationId', 'name address isActive')
    .lean();

  if (!operator) {
    console.log('❌ Operator not found with ID:', id);
    return res.status(404).json({ error: 'Operator not found or not under your supervision' });
  }

  console.log('✅ Operator details fetched:', operator);

  res.json({ success: true, operator });
}));

// Get all operators under supervisors who report to this GS (view only) - Mongoose
router.get('/operators', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;
  const { status, supervisorId, locationId } = req.query;
  
  let query: any = {};
  
  // If General Supervisor, only show operators under their supervisors
  if (userRole === 'GENERAL_SUPERVISOR') {
    const gs = await Supervisor.findOne({
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    }).lean();

    if (!gs) {
      return res.status(404).json({ error: 'General Supervisor profile not found' });
    }

    // Find supervisors under this GS
    let supervisors = await Supervisor.find({
      generalSupervisorId: gs._id,
    }).select('_id').lean();

    // Fallback: If no supervisors found with generalSupervisorId, show all SUPERVISOR type
    if (supervisors.length === 0) {
      console.log('⚠️ Operators List: No supervisors with generalSupervisorId, fetching all SUPERVISOR type as fallback');
      supervisors = await Supervisor.find({
        supervisorType: 'SUPERVISOR',
        approvalStatus: 'APPROVED',
      }).select('_id').lean();
    }

    const supervisorIds = supervisors.map(s => s._id);
    
    // IMPORTANT: Also include the GS themselves
    // because operators can be registered directly by the GS
    supervisorIds.push(gs._id);
    console.log(`📊 Operators List: Checking operators under ${supervisorIds.length} supervisors (including GS)`);
    
    // If supervisorId filter is provided, AND it with the supervisorIds array
    if (supervisorId) {
      query.supervisorId = { $in: [supervisorId, ...supervisorIds] };
    } else {
      query.supervisorId = { $in: supervisorIds };
    }
  }

  // Additional filter for location
  if (locationId) {
    query.locationId = locationId;
  }

  // Fetch operators
  const operators = await Operator.find(query)
    .populate({
      path: 'userId',
      select: 'email firstName lastName phone status profilePhoto passportPhoto employeeId',
      match: status ? { status } : undefined,
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

  // Filter out operators where user didn't match status filter
  const filteredOperators = operators.filter(op => op.userId !== null);

  res.json({ success: true, operators: filteredOperators });
}));

// Get locations under GS supervision
router.get('/locations', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { Location, Operator } = require('../models');
  
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Get supervisors under this GS
  const supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
  }).select('locationId').lean();

  const locationIds = supervisors
    .map(s => s.locationId)
    .filter((id): id is any => id !== null);

  // Get locations
  const locations = await Location.find({
    $or: [
      { _id: { $in: locationIds } },
      { isActive: true },
    ],
  }).sort({ name: 1 }).lean();

  // Get detailed info for each location
  const locationsWithDetails = await Promise.all(
    locations.map(async (loc: any) => {
      const locationSupervisors = await Supervisor.find({
        locationId: loc._id,
        generalSupervisorId: gs._id,
      }).populate('userId', 'firstName lastName').lean();
      
      const operatorCount = await Operator.countDocuments({
        locationId: loc._id,
        supervisorId: { $in: supervisors.map(s => s._id) },
      });
      
      const supervisorCount = locationSupervisors.length;
      
      return {
        ...loc,
        operatorCount,
        supervisorCount,
        assignedSupervisors: locationSupervisors.map((s: any) => ({
          id: s._id,
          name: `${s.userId?.firstName || ''} ${s.userId?.lastName || ''}`,
        })),
      };
    })
  );

  res.json(locationsWithDetails);
}));

// Get attendance for operators under GS supervision
router.get('/attendance', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { date, supervisorId, locationId } = req.query;
  const { Attendance, Operator, Shift } = require('../models');
  
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  const targetDate = date ? new Date(date as string) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  // Get supervisors under this GS
  const supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
  }).select('_id').lean();

  const supervisorIds = supervisors.map(s => s._id);

  // Build operator filter
  let operatorFilter: any = { supervisorId: { $in: supervisorIds } };
  if (supervisorId) {
    operatorFilter.supervisorId = supervisorId;
  }
  if (locationId) {
    operatorFilter.locationId = locationId;
  }

  // Get operators under supervision
  const operators = await Operator.find(operatorFilter).select('_id').lean();
  const operatorIds = operators.map(o => o._id);

  // Get attendance records
  const attendance = await Attendance.find({
    checkInTime: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    operatorId: { $in: operatorIds },
  })
  .populate({
    path: 'operatorId',
    populate: [
      { path: 'userId', select: 'firstName lastName profilePhoto' },
      { path: 'supervisorId', populate: { path: 'userId', select: 'firstName lastName' } },
      { path: 'locationId', select: 'name' },
    ],
  })
  .populate('shiftId')
  .sort({ checkInTime: -1 })
  .lean();

  // Get total active operators for attendance calculation
  const activeOperators = await Operator.find(operatorFilter)
    .populate('userId', 'status')
    .lean();
  
  const totalOperators = activeOperators.filter((op: any) => op.userId?.status === 'ACTIVE').length;

  res.json({
    date: startOfDay.toISOString().split('T')[0],
    totalOperators,
    presentCount: attendance.length,
    attendanceRate: totalOperators > 0 ? Math.round((attendance.length / totalOperators) * 100) : 0,
    records: attendance,
  });
}));

// Get incidents from supervisors under this GS
router.get('/incidents', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { status, severity, supervisorId } = req.query;
  const { IncidentReport } = require('../models');
  
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Get supervisors under this GS
  const supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
  }).select('_id').lean();

  const supervisorIds = supervisors.map(s => s._id);

  const whereClause: any = {
    supervisorId: { $in: supervisorIds },
  };

  if (status) {
    whereClause.status = status;
  }

  if (severity) {
    whereClause.severity = severity;
  }

  if (supervisorId) {
    whereClause.supervisorId = supervisorId;
  }

  const incidents = await IncidentReport.find(whereClause)
    .populate({
      path: 'operatorId',
      populate: [
        { path: 'userId', select: 'firstName lastName' },
        { path: 'locationId', select: 'name' },
      ],
    })
    .populate({
      path: 'supervisorId',
      populate: { path: 'userId', select: 'firstName lastName' },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.json(incidents);
}));

// Get activity logs for GS and their team
router.get('/activity-logs', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { startDate, endDate, actionType, limit = 50 } = req.query;
  const { AuditLog, Operator } = require('../models');
  
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Get all user IDs under this GS (supervisors and their operators)
  const subordinateSupervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
  }).select('userId').lean();

  const supervisorIds = subordinateSupervisors.map(s => s._id);
  
  const operatorUsers = await Operator.find({
    supervisorId: { $in: supervisorIds },
  }).select('userId').lean();

  const userIds = [
    userId, // GS themselves
    ...subordinateSupervisors.map((s: any) => s.userId),
    ...operatorUsers.map((o: any) => o.userId),
  ];

  const whereClause: any = {
    userId: { $in: userIds },
  };

  if (startDate && endDate) {
    whereClause.timestamp = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string),
    };
  }

  if (actionType) {
    whereClause.action = actionType;
  }

  const logs = await AuditLog.find(whereClause)
    .populate('userId', 'firstName lastName role profilePhoto')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit as string))
    .lean();

  res.json(logs);
}));

// Get GS profile
router.get('/profile', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  
  const user = await User.findById(userId)
    .select('email phone firstName lastName profilePhoto passportPhoto gender dateOfBirth state lga employeeId createdAt')
    .lean();

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const supervisor = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  const subordinateSupervisorCount = supervisor 
    ? await Supervisor.countDocuments({ generalSupervisorId: supervisor._id })
    : 0;

  res.json({
    user,
    supervisor,
    subordinateSupervisorCount,
  });
}));

// Update GS profile (limited fields)
router.patch('/profile', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { phone, profilePhoto } = req.body;
  
  const updateData: any = {};
  if (phone) updateData.phone = phone;
  if (profilePhoto) updateData.profilePhoto = profilePhoto;

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  )
  .select('email phone firstName lastName profilePhoto')
  .lean();

  res.json(user);
}));

// Get supervisors under this GS
router.get('/supervisors', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  
  // Get the GS's supervisor record
  const gs = await Supervisor.findOne({
    userId,
    supervisorType: 'GENERAL_SUPERVISOR',
  }).lean();

  if (!gs) {
    return res.json({ supervisors: [] });
  }

  const supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
    approvalStatus: 'APPROVED',
  })
  .populate('userId', 'firstName lastName email phone')
  .lean();

  res.json({ supervisors });
}));

// Register Operator (General Supervisor)
router.post('/operators/register', asyncHandler(async (req: any, res) => {
  const bcrypt = require('bcryptjs');
  const { sendOperatorWelcomeEmail } = require('../services/email.service');
  const { GuardAssignment } = require('../models/GuardAssignment.model');
  
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

  const gsUserId = req.user.userId;
  const gsUser = await User.findById(gsUserId);

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
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const employeeId = `OPR-${timestamp}-${random}`;

  // Generate temporary password
  const temporaryPassword = `Opr${Math.random().toString(36).substring(2, 10)}!`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // Create user with ACTIVE status
  const newUser = new User({
    email: email.toLowerCase(),
    phone: phone || undefined,
    passwordHash: hashedPassword,
    role: 'OPERATOR',
    status: 'ACTIVE',
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
    createdById: gsUserId,
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
    approvalStatus: 'APPROVED',
    salary: 0,
    startDate: new Date(),
  });

  await newOperator.save();

  // Create GuardAssignment if BIT, location, and supervisor are specified
  let guardAssignment = null;
  if (bitId && bitId !== '' && locationId && locationId !== '' && supervisorId && supervisorId !== '') {
    try {
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
          userId: gsUserId,
          role: 'GENERAL_SUPERVISOR',
          name: `${gsUser?.firstName || ''} ${gsUser?.lastName || ''}`.trim() || 'General Supervisor',
        },
        approvedBy: {
          userId: gsUserId,
          role: 'GENERAL_SUPERVISOR',
          name: `${gsUser?.firstName || ''} ${gsUser?.lastName || ''}`.trim() || 'General Supervisor',
        },
        approvedAt: new Date(),
      });

      await guardAssignment.save();
    } catch (assignmentError) {
      console.error('❌ Failed to create GuardAssignment:', assignmentError);
    }
  }

  // Get location details for SMS/Email
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

  // Send welcome email
  if (email) {
    sendOperatorWelcomeEmail({
      email: email,
      firstName,
      lastName,
      employeeId,
      locationName,
      temporaryPassword,
    }).catch((error: any) => {
      logger.error('❌ Failed to send welcome email:', error);
    });
  }

  res.status(201).json({
    success: true,
    message: 'Operator registered successfully.',
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
      temporaryPassword,
      assignmentCreated: !!guardAssignment,
      assignmentId: guardAssignment?._id,
    },
  });
}));

export default router;
