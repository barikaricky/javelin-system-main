import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { User, Supervisor } from '../models';

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
  const gs = await prisma.supervisors.findFirst({
    where: {
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    },
  });

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

  // Get all stats and data in parallel
  const [
    subordinateSupervisors,
    totalOperators,
    activeLocations,
    todayAttendance,
    openIncidents,
    supervisorsList,
    incidentsList,
    locationsList,
  ] = await Promise.all([
    // Supervisors under this GS
    prisma.supervisors.count({
      where: { generalSupervisorId: gs.id, approvalStatus: 'APPROVED' },
    }),
    // Total operators under supervisors who report to this GS
    prisma.operators.count({
      where: {
        supervisors: {
          generalSupervisorId: gs.id,
        },
      },
    }),
    // Active locations (bits)
    prisma.locations.count({
      where: { isActive: true },
    }),
    // Today's attendance
    prisma.attendances.count({
      where: {
        checkInTime: { gte: today },
        operators: {
          supervisors: {
            generalSupervisorId: gs.id,
          },
        },
      },
    }),
    // Open incidents
    prisma.incident_reports.count({
      where: {
        status: { in: ['REPORTED', 'UNDER_REVIEW'] },
        supervisors: {
          generalSupervisorId: gs.id,
        },
      },
    }),
    // Supervisors list
    prisma.supervisors.findMany({
      where: {
        generalSupervisorId: gs.id,
        approvalStatus: 'APPROVED',
      },
      take: 10,
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
            profilePhoto: true,
            status: true,
            lastLogin: true,
          },
        },
        locations: { select: { name: true } },
        _count: { select: { operators: true } },
      },
    }),
    // Recent incidents
    prisma.incident_reports.findMany({
      where: {
        status: { in: ['REPORTED', 'UNDER_REVIEW'] },
        supervisors: {
          generalSupervisorId: gs.id,
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        operators: {
          include: {
            users: { select: { firstName: true, lastName: true } },
            locations: { select: { name: true } },
          },
        },
      },
    }),
    // Locations under GS's supervisors
    prisma.locations.findMany({
      where: { isActive: true },
      take: 10,
      include: {
        supervisors: {
          where: { generalSupervisorId: gs.id },
          include: {
            users: { select: { firstName: true, lastName: true } },
          },
        },
        operators: true,
      },
    }),
  ]);

  // Calculate attendance rate
  const attendanceRate = totalOperators > 0 ? Math.round((todayAttendance / totalOperators) * 100) : 0;

  // Map supervisors to expected format
  const mappedSupervisors = supervisorsList.map(sup => {
    const lastLogin = sup.users.lastLogin;
    let status: 'active' | 'on-leave' | 'offline' = 'offline';
    if (sup.users.status === 'ACTIVE') {
      if (lastLogin && (new Date().getTime() - lastLogin.getTime()) < 3600000) {
        status = 'active';
      }
    } else if (sup.users.status === 'ON_LEAVE') {
      status = 'on-leave';
    }

    return {
      id: sup.id,
      name: `${sup.users.firstName} ${sup.users.lastName}`,
      photo: sup.users.profilePhoto || undefined,
      locationsCount: sup.locationsAssigned?.length || 0,
      operatorsCount: sup._count.operators,
      status,
      lastActivity: lastLogin ? getRelativeTime(lastLogin) : 'Never',
      performance: 90, // Default performance score
    };
  });

  // Map incidents to expected format
  const mappedIncidents = incidentsList.map(inc => ({
    id: inc.id,
    title: inc.title,
    location: inc.operators?.locations?.name || 'Unknown',
    reportedBy: inc.operators?.users ? `Op. ${inc.operators.users.firstName}` : 'Unknown',
    severity: inc.severity.toLowerCase() as 'high' | 'medium' | 'low',
    time: getRelativeTime(inc.createdAt),
    status: inc.status === 'REPORTED' ? 'open' : inc.status === 'UNDER_REVIEW' ? 'investigating' : 'resolved' as 'open' | 'investigating' | 'resolved',
  }));

  // Map locations to expected format
  const mappedLocations = locationsList.filter(loc => loc.supervisors.length > 0).map(loc => ({
    id: loc.id,
    name: loc.name,
    supervisor: loc.supervisors[0]?.users ? `${loc.supervisors[0].users.firstName} ${loc.supervisors[0].users.lastName}` : 'Unassigned',
    operatorsAssigned: 10, // Default
    operatorsPresent: loc.operators.length,
    status: loc.operators.length >= 8 ? 'green' : loc.operators.length >= 5 ? 'yellow' : 'red' as 'green' | 'yellow' | 'red',
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
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Get supervisors under this General Supervisor
  supervisors = await Supervisor.find({
    generalSupervisorId: gs._id,
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

  res.json(supervisorsWithCounts);
}));

// Get a specific supervisor's details
router.get('/my-supervisors/:supervisorId', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { supervisorId } = req.params;
  
  const gs = await prisma.supervisors.findFirst({
    where: {
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    },
  });

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  const supervisor = await prisma.supervisors.findFirst({
    where: {
      id: supervisorId,
      generalSupervisorId: gs.id,
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          status: true,
          profilePhoto: true,
          passportPhoto: true,
          gender: true,
          dateOfBirth: true,
          state: true,
          lga: true,
        },
      },
      locations: true,
      operators: {
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
              profilePhoto: true,
            },
          },
          locations: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          operators: true,
          incident_reports: true,
        },
      },
    },
  });

  if (!supervisor) {
    return res.status(404).json({ error: 'Supervisor not found or not under your supervision' });
  }

  res.json(supervisor);
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
    const supervisors = await Supervisor.find({
      generalSupervisorId: gs._id,
    }).select('_id').lean();

    const supervisorIds = supervisors.map(s => s._id);
    
    if (supervisorIds.length > 0) {
      query.supervisorId = { $in: supervisorIds };
    } else {
      // If GS has no supervisors yet, return empty array
      return res.json({ success: true, operators: [] });
    }
  }

  // Additional filters
  if (supervisorId) {
    query.supervisorId = supervisorId;
  }

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
  
  const gs = await prisma.supervisors.findFirst({
    where: {
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    },
  });

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Get locations that have supervisors under this GS
  const supervisorIds = await prisma.supervisors.findMany({
    where: { generalSupervisorId: gs.id },
    select: { locationId: true },
  });

  const locationIds = supervisorIds
    .map(s => s.locationId)
    .filter((id): id is string => id !== null);

  const locations = await prisma.locations.findMany({
    where: {
      OR: [
        { id: { in: locationIds } },
        { isActive: true }, // Also show all active locations
      ],
    },
    include: {
      supervisors: {
        where: { generalSupervisorId: gs.id },
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      operators: {
        where: {
          supervisors: {
            generalSupervisorId: gs.id,
          },
        },
      },
      _count: {
        select: {
          operators: true,
          supervisors: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.json(locations.map(loc => ({
    ...loc,
    operatorCount: loc._count.operators,
    supervisorCount: loc._count.supervisors,
    assignedSupervisors: loc.supervisors.map(s => ({
      id: s.id,
      name: `${s.users.firstName} ${s.users.lastName}`,
    })),
  })));
}));

// Get attendance for operators under GS supervision
router.get('/attendance', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { date, supervisorId, locationId } = req.query;
  
  const gs = await prisma.supervisors.findFirst({
    where: {
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    },
  });

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  const targetDate = date ? new Date(date as string) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const whereClause: any = {
    checkInTime: {
      gte: startOfDay,
      lte: endOfDay,
    },
    operators: {
      supervisors: {
        generalSupervisorId: gs.id,
      },
    },
  };

  if (supervisorId) {
    whereClause.operators = {
      ...whereClause.operators,
      supervisorId,
    };
  }

  if (locationId) {
    whereClause.operators = {
      ...whereClause.operators,
      locationId,
    };
  }

  const attendance = await prisma.attendances.findMany({
    where: whereClause,
    include: {
      operators: {
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
              profilePhoto: true,
            },
          },
          supervisors: {
            include: {
              users: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          locations: {
            select: {
              name: true,
            },
          },
        },
      },
      shifts: true,
    },
    orderBy: { checkInTime: 'desc' },
  });

  // Get total operators for attendance calculation
  const totalOperators = await prisma.operators.count({
    where: {
      supervisors: {
        generalSupervisorId: gs.id,
      },
      users: {
        status: 'ACTIVE',
      },
    },
  });

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
  
  const gs = await prisma.supervisors.findFirst({
    where: {
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    },
  });

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  const whereClause: any = {
    supervisors: {
      generalSupervisorId: gs.id,
    },
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

  const incidents = await prisma.incident_reports.findMany({
    where: whereClause,
    include: {
      operators: {
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          locations: {
            select: {
              name: true,
            },
          },
        },
      },
      supervisors: {
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(incidents);
}));

// Get activity logs for GS and their team
router.get('/activity-logs', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { startDate, endDate, actionType, limit = 50 } = req.query;
  
  const gs = await prisma.supervisors.findFirst({
    where: {
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    },
  });

  if (!gs) {
    return res.status(404).json({ error: 'General Supervisor profile not found' });
  }

  // Get all user IDs under this GS (supervisors and their operators)
  const subordinateSupervisors = await prisma.supervisors.findMany({
    where: { generalSupervisorId: gs.id },
    select: { userId: true },
  });

  const operatorUsers = await prisma.operators.findMany({
    where: {
      supervisors: {
        generalSupervisorId: gs.id,
      },
    },
    select: { userId: true },
  });

  const userIds = [
    userId, // GS themselves
    ...subordinateSupervisors.map(s => s.userId),
    ...operatorUsers.map(o => o.userId),
  ];

  const whereClause: any = {
    userId: { in: userIds },
  };

  if (startDate && endDate) {
    whereClause.timestamp = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  if (actionType) {
    whereClause.action = actionType;
  }

  const logs = await prisma.audit_logs.findMany({
    where: whereClause,
    include: {
      users: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: parseInt(limit as string),
  });

  res.json(logs);
}));

// Get GS profile
router.get('/profile', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      profilePhoto: true,
      passportPhoto: true,
      gender: true,
      dateOfBirth: true,
      state: true,
      lga: true,
      employeeId: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const supervisor = await prisma.supervisors.findFirst({
    where: {
      userId,
      supervisorType: 'GENERAL_SUPERVISOR',
    },
    include: {
      _count: {
        select: {
          subordinateSupervisors: true,
        },
      },
    },
  });

  res.json({
    user,
    supervisor,
    subordinateSupervisorCount: supervisor?._count.subordinateSupervisors || 0,
  });
}));

// Update GS profile (limited fields)
router.patch('/profile', asyncHandler(async (req: any, res) => {
  const userId = req.user.userId;
  const { phone, profilePhoto } = req.body;
  
  const updateData: any = {};
  if (phone) updateData.phone = phone;
  if (profilePhoto) updateData.profilePhoto = profilePhoto;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      profilePhoto: true,
    },
  });

  res.json(user);
}));

export default router;
