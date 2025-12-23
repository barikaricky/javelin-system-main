import bcrypt from 'bcryptjs';
import { RegistrationRequest, User, Manager, Supervisor, Secretary, Operator, Location } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { sendCredentialsEmail } from './email.service';

interface CreateRequestData {
  requestedById: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  locationId?: string;
  department?: string;
  startDate?: Date;
  profilePhoto?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  employmentType?: string;
  shift?: string;
  documents?: any;
  managerComments?: string;
}

interface FilterOptions {
  role?: string;
  status?: string;
  requestedById?: string;
  locationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const roleMapping: Record<string, string> = {
  SUPERVISOR: 'SUPERVISOR',
  HR: 'SECRETARY',
  SECRETARY: 'SECRETARY',
  GENERAL_SUPERVISOR: 'GENERAL_SUPERVISOR',
  GUARD: 'OPERATOR',
};

const idPrefixMapping: Record<string, string> = {
  SUPERVISOR: 'SUP',
  HR: 'HR',
  SECRETARY: 'SEC',
  GENERAL_SUPERVISOR: 'GSUP',
  GUARD: 'GRD',
};

async function generateEmployeeId(role: string): Promise<string> {
  const prefix = idPrefixMapping[role];
  const count = await User.countDocuments({
    employeeId: new RegExp(`^${prefix}`)
  });
  const nextNumber = count + 1;
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}

function generatePassword(employeeId: string): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 8; i++) {
    randomString += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return `javelin_${employeeId}_${randomString}`;
}

function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ') || parts[0];
  return { firstName, lastName };
}

export async function createRegistrationRequest(data: CreateRequestData) {
  try {
    logger.info('Creating registration request', { email: data.email, role: data.role });

    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('This email is already registered', 409);
    }

    const existingRequest = await RegistrationRequest.findOne({
      email: data.email.toLowerCase(),
      status: 'PENDING',
    });

    if (existingRequest) {
      throw new AppError('A pending registration request already exists for this email', 409);
    }

    const request = await RegistrationRequest.create({
      requestedById: data.requestedById,
      fullName: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      role: data.role,
      locationId: data.locationId || null,
      department: data.department || null,
      startDate: data.startDate || null,
      profilePhoto: data.profilePhoto || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      address: data.address || null,
      employmentType: data.employmentType || 'FULL_TIME',
      shift: data.shift || null,
      documents: data.documents || null,
      managerComments: data.managerComments || null,
      status: 'PENDING',
    });

    const populated = await RegistrationRequest.findById(request._id)
      .populate({
        path: 'requestedById',
        populate: {
          path: 'userId',
          select: 'firstName lastName email',
        },
      })
      .populate('locationId');

    logger.info('Registration request created', { requestId: request._id });

    return {
      success: true,
      request: formatRequest(populated),
    };
  } catch (error: any) {
    logger.error('Error creating registration request:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to create registration request', 500);
  }
}

export async function getPendingRequests(filters: FilterOptions = {}) {
  try {
    const where: any = {};

    where.status = filters.status || 'PENDING';

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.requestedById) {
      where.requestedById = filters.requestedById;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.$lte = filters.dateTo;
      }
    }

    const requests = await RegistrationRequest.find(where)
      .populate({
        path: 'requestedById',
        populate: {
          path: 'userId',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .populate('locationId')
      .sort({ createdAt: -1 });

    const roleCounts = await RegistrationRequest.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const managerCounts = await RegistrationRequest.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: '$requestedById', count: { $sum: 1 } } },
    ]);

    return {
      success: true,
      requests: requests.map(formatRequest),
      totalCount: requests.length,
      roleCounts: roleCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      managerCounts: managerCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error: any) {
    logger.error('Error fetching pending requests:', error);
    throw new AppError('Failed to fetch pending requests', 500);
  }
}

export async function getRequestById(requestId: string) {
  const request = await RegistrationRequest.findById(requestId)
    .populate({
      path: 'requestedById',
      populate: {
        path: 'userId',
        select: 'firstName lastName email profilePhoto',
      },
    })
    .populate('locationId');

  if (!request) {
    throw new AppError('Registration request not found', 404);
  }

  return formatRequest(request);
}

export async function approveRequest(requestId: string, reviewerId: string) {
  try {
    logger.info('Approving registration request', { requestId, reviewerId });

    const request = await RegistrationRequest.findById(requestId).populate({
      path: 'requestedById',
      populate: { path: 'userId' },
    });

    if (!request) {
      throw new AppError('Registration request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('This request has already been processed', 400);
    }

    const employeeId = await generateEmployeeId(request.role);
    const temporaryPassword = generatePassword(employeeId);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const { firstName, lastName } = parseFullName(request.fullName);
    const userRole = roleMapping[request.role];

    const user = await User.create({
      email: request.email,
      phone: request.phone || null,
      passwordHash,
      role: userRole,
      status: 'ACTIVE',
      firstName,
      lastName,
      profilePhoto: request.profilePhoto || null,
      employeeId,
      gender: request.gender || null,
      dateOfBirth: request.dateOfBirth || null,
      createdById: reviewerId,
    });

    if (request.role === 'SUPERVISOR' || request.role === 'GENERAL_SUPERVISOR') {
      await Supervisor.create({
        userId: user._id,
        employeeId,
        locationId: request.locationId || null,
        salary: 0,
        startDate: request.startDate || new Date(),
        address: request.address || '',
        dateOfEmployment: request.startDate || new Date(),
        fullName: request.fullName,
        passportPhoto: request.profilePhoto || null,
        supervisorType: request.role === 'GENERAL_SUPERVISOR' ? 'GENERAL_SUPERVISOR' : 'SUPERVISOR',
      });
    } else if (request.role === 'SECRETARY' || request.role === 'HR') {
      await Secretary.create({
        userId: user._id,
        employeeId,
        startDate: request.startDate || new Date(),
      });
    } else if (request.role === 'GUARD') {
      const defaultSupervisor = await Supervisor.findOne();
      if (!defaultSupervisor) {
        throw new AppError('No supervisor available to assign this guard', 400);
      }

      await Operator.create({
        userId: user._id,
        employeeId,
        supervisorId: defaultSupervisor._id,
        locationId: request.locationId || null,
        passportPhoto: request.profilePhoto || null,
        salary: 0,
        startDate: request.startDate || new Date(),
      });
    }

    const updatedRequest = await RegistrationRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'APPROVED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        generatedUserId: user._id,
        generatedEmployeeId: employeeId,
        generatedPassword: temporaryPassword,
      },
      { new: true }
    );

    logger.info('Registration request approved', {
      requestId,
      userId: user._id,
      employeeId,
    });

    let emailSent = false;
    try {
      await sendCredentialsEmail({
        email: request.email,
        firstName,
        username: request.email,
        password: temporaryPassword,
      });
      emailSent = true;
      logger.info('Credentials email sent', { email: request.email });
    } catch (emailError) {
      logger.error('Failed to send credentials email', { email: request.email, error: emailError });
    }

    return {
      success: true,
      user: {
        id: user._id,
        employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
      credentials: {
        email: user.email,
        password: temporaryPassword,
      },
      emailSent,
    };
  } catch (error: any) {
    logger.error('Error approving registration request:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to approve registration request', 500);
  }
}

export async function rejectRequest(requestId: string, reviewerId: string, reason?: string) {
  try {
    logger.info('Rejecting registration request', { requestId, reviewerId, reason });

    const request = await RegistrationRequest.findById(requestId).populate({
      path: 'requestedById',
      populate: { path: 'userId' },
    });

    if (!request) {
      throw new AppError('Registration request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('This request has already been processed', 400);
    }

    const updatedRequest = await RegistrationRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'REJECTED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason || null,
      },
      { new: true }
    ).populate({
      path: 'requestedById',
      populate: {
        path: 'userId',
        select: 'firstName lastName email',
      },
    });

    logger.info('Registration request rejected', { requestId });

    return {
      success: true,
      request: formatRequest(updatedRequest),
    };
  } catch (error: any) {
    logger.error('Error rejecting registration request:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to reject registration request', 500);
  }
}

export async function getApprovalStats() {
  const [pendingCount, approvedToday, rejectedToday, approvedThisWeek] = await Promise.all([
    RegistrationRequest.countDocuments({ status: 'PENDING' }),
    RegistrationRequest.countDocuments({
      status: 'APPROVED',
      reviewedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    RegistrationRequest.countDocuments({
      status: 'REJECTED',
      reviewedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    RegistrationRequest.countDocuments({
      status: 'APPROVED',
      reviewedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    pending: pendingCount,
    approvedToday,
    rejectedToday,
    approvedThisWeek,
  };
}

export async function getRequestingManagers() {
  const managers = await Manager.find()
    .populate({
      path: 'userId',
      select: 'firstName lastName email profilePhoto',
    });

  const managersWithCounts = await Promise.all(
    managers.map(async (m) => {
      const requestCount = await RegistrationRequest.countDocuments({
        requestedById: m._id,
        status: 'PENDING',
      });
      
      return {
        id: m._id,
        name: `${(m.userId as any).firstName} ${(m.userId as any).lastName}`,
        email: (m.userId as any).email,
        profilePhoto: (m.userId as any).profilePhoto,
        requestCount,
      };
    })
  );

  return managersWithCounts.filter(m => m.requestCount > 0);
}

function formatRequest(request: any) {
  const manager = request.requestedById;
  return {
    id: request._id,
    fullName: request.fullName,
    email: request.email,
    phone: request.phone,
    role: request.role,
    roleDisplay: formatRoleDisplay(request.role),
    location: request.locationId
      ? {
          id: request.locationId._id,
          name: request.locationId.name,
          address: request.locationId.address,
        }
      : null,
    department: request.department,
    startDate: request.startDate,
    profilePhoto: request.profilePhoto,
    dateOfBirth: request.dateOfBirth,
    gender: request.gender,
    address: request.address,
    employmentType: request.employmentType,
    shift: request.shift,
    documents: request.documents,
    managerComments: request.managerComments,
    status: request.status,
    requestedBy: manager?.userId
      ? {
          id: manager._id,
          name: `${manager.userId.firstName} ${manager.userId.lastName}`,
          email: manager.userId.email,
          profilePhoto: manager.userId.profilePhoto,
        }
      : null,
    reviewedById: request.reviewedById,
    reviewedAt: request.reviewedAt,
    rejectionReason: request.rejectionReason,
    generatedEmployeeId: request.generatedEmployeeId,
    generatedPassword: request.generatedPassword,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function formatRoleDisplay(role: string): string {
  const displays: Record<string, string> = {
    SUPERVISOR: 'Supervisor',
    HR: 'HR Personnel',
    SECRETARY: 'Secretary',
    GENERAL_SUPERVISOR: 'General Supervisor',
    GUARD: 'Guard',
  };
  return displays[role] || role;
}
