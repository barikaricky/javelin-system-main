import { Admin, User, Beat, Location, Operator, Supervisor } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import path from 'path';

/**
 * Convert absolute file path to relative URL path
 */
function normalizeFilePath(filePath: string | undefined): string | undefined {
  if (!filePath) return undefined;
  
  // If already a relative path starting with /uploads, return as is
  if (filePath.startsWith('/uploads')) return filePath;
  
  // If it's an absolute path, extract the filename and create relative path
  if (filePath.includes('uploads')) {
    const filename = path.basename(filePath);
    // Check which upload directory it belongs to
    if (filePath.includes('admin-documents')) {
      return `/uploads/admin-documents/${filename}`;
    }
    return `/uploads/${filename}`;
  }
  
  return filePath;
}

interface CreateAdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  jobTitle: string;
  department: string;
  officeLocationId: string;
  adminRoleLevel: 'BASIC' | 'SENIOR' | 'LEAD';
  employmentStartDate: Date;
  nationalId?: string;
  governmentIdUrl?: string;
  passportPhotoUrl?: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  stateOfOrigin?: string;
  lga?: string;
  salary?: number;
  salaryCategory?: string;
  bankName?: string;
  bankAccountNumber?: string;
  accessExpiryDate?: Date;
  createdById: string;
  notes?: string;
}

/**
 * Register a new admin (Manager/Director only)
 */
export async function registerAdmin(data: CreateAdminData) {
  try {
    logger.info('Registering new admin', { email: data.email });

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user account (director-registered admins are immediately active)
    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE', // Director-approved admins are immediately active
      isActive: true,
      mustChangePassword: true, // Force password change on first login
    });

    // Generate staff ID
    const adminCount = await Admin.countDocuments();
    const staffId = `ADM-${String(adminCount + 1).padStart(5, '0')}`;

    // Create admin record
    const admin = await Admin.create({
      userId: user._id,
      staffId,
      jobTitle: data.jobTitle,
      department: data.department,
      officeLocationId: data.officeLocationId,
      adminRoleLevel: data.adminRoleLevel,
      employmentStartDate: data.employmentStartDate,
      nationalId: data.nationalId,
      governmentIdUrl: data.governmentIdUrl,
      passportPhotoUrl: data.passportPhotoUrl,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      stateOfOrigin: data.stateOfOrigin,
      lga: data.lga,
      salary: data.salary,
      salaryCategory: data.salaryCategory,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      accessExpiryDate: data.accessExpiryDate,
      createdById: data.createdById,
      notes: data.notes,
      isActive: true,
      isSuspended: false,
      loginHistory: [],
    });

    logger.info('Admin registered successfully', { 
      adminId: admin._id, 
      staffId: admin.staffId,
      userId: user._id 
    });

    return {
      admin: await admin.populate([
        { path: 'userId', select: '-password' },
        { path: 'officeLocationId', select: 'locationName city state' },
        { path: 'createdById', select: 'firstName lastName email' },
      ]),
      user,
    };
  } catch (error: any) {
    logger.error('Error registering admin:', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to register admin', 500);
  }
}

/**
 * Get all admins with filters
 */
export async function getAllAdmins(filters?: {
  isActive?: boolean;
  isSuspended?: boolean;
  officeLocationId?: string;
  department?: string;
  adminRoleLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { 
    isActive, 
    isSuspended, 
    officeLocationId, 
    department, 
    adminRoleLevel, 
    search, 
    page = 1, 
    limit = 50 
  } = filters || {};

  const filter: any = {};

  if (isActive !== undefined) filter.isActive = isActive;
  if (isSuspended !== undefined) filter.isSuspended = isSuspended;
  if (officeLocationId) filter.officeLocationId = officeLocationId;
  if (department) filter.department = department;
  if (adminRoleLevel) filter.adminRoleLevel = adminRoleLevel;

  if (search) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
      role: 'ADMIN',
    }).select('_id');

    const userIds = users.map(u => u._id);
    
    filter.$or = [
      { userId: { $in: userIds } },
      { staffId: { $regex: search, $options: 'i' } },
      { jobTitle: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [admins, total] = await Promise.all([
    Admin.find(filter)
      .populate('userId', '-password')
      .populate('officeLocationId', 'locationName city state')
      .populate('createdById', 'firstName lastName email')
      .populate('suspendedById', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Admin.countDocuments(filter),
  ]);

  return {
    admins,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get admin by ID
 */
export async function getAdminById(adminId: string) {
  const admin = await Admin.findById(adminId)
    .populate('userId', '-password')
    .populate('officeLocationId')
    .populate('createdById', 'firstName lastName email')
    .populate('suspendedById', 'firstName lastName email')
    .lean();

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  return admin;
}

/**
 * Get admin by user ID
 */
export async function getAdminByUserId(userId: string) {
  const admin = await Admin.findOne({ userId })
    .select('staffId jobTitle department adminRoleLevel employmentStartDate passportPhotoUrl governmentIdUrl address stateOfOrigin lga gender dateOfBirth salary bankName bankAccountNumber isActive isSuspended loginHistory lastLoginAt officeLocationId')
    .populate('userId', 'id email firstName lastName phone phoneNumber role profilePhoto passportPhoto')
    .populate('officeLocationId', 'name address city state')
    .lean();

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  // Normalize file paths for serving
  if (admin.passportPhotoUrl) {
    admin.passportPhotoUrl = normalizeFilePath(admin.passportPhotoUrl);
  }
  if (admin.governmentIdUrl) {
    admin.governmentIdUrl = normalizeFilePath(admin.governmentIdUrl);
  }

  return admin;
}

/**
 * Update admin
 */
export async function updateAdmin(
  adminId: string,
  updates: Partial<CreateAdminData>
) {
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('userId', '-password')
    .populate('officeLocationId')
    .populate('createdById', 'firstName lastName email');

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  logger.info('Admin updated', { adminId });
  return admin;
}

/**
 * Suspend admin (Director only)
 */
export async function suspendAdmin(
  adminId: string,
  reason: string,
  suspendedById: string
) {
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    {
      $set: {
        isSuspended: true,
        isActive: false,
        suspensionReason: reason,
        suspendedAt: new Date(),
        suspendedById,
      },
    },
    { new: true }
  ).populate('userId', '-password');

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  // Deactivate user account
  await User.findByIdAndUpdate(admin.userId, { isActive: false });

  logger.info('Admin suspended', { adminId, reason });
  return admin;
}

/**
 * Reactivate admin
 */
export async function reactivateAdmin(adminId: string) {
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    {
      $set: {
        isSuspended: false,
        isActive: true,
        suspensionReason: undefined,
        suspendedAt: undefined,
        suspendedById: undefined,
      },
    },
    { new: true }
  ).populate('userId', '-password');

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  // Reactivate user account
  await User.findByIdAndUpdate(admin.userId, { isActive: true });

  logger.info('Admin reactivated', { adminId });
  return admin;
}

/**
 * Log admin login
 */
export async function logAdminLogin(
  userId: string,
  ipAddress: string,
  device: string,
  success: boolean = true
) {
  const admin = await Admin.findOne({ userId });
  
  if (admin) {
    admin.loginHistory.push({
      timestamp: new Date(),
      ipAddress,
      device,
      success,
    });

    if (success) {
      admin.lastLoginAt = new Date();
      admin.lastLoginIp = ipAddress;
    }

    // Keep only last 50 login records
    if (admin.loginHistory.length > 50) {
      admin.loginHistory = admin.loginHistory.slice(-50);
    }

    await admin.save();
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  const [
    totalAdmins,
    activeAdmins,
    suspendedAdmins,
    byDepartment,
    byRoleLevel,
  ] = await Promise.all([
    Admin.countDocuments(),
    Admin.countDocuments({ isActive: true, isSuspended: false }),
    Admin.countDocuments({ isSuspended: true }),
    Admin.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Admin.aggregate([
      { $group: { _id: '$adminRoleLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalAdmins,
    activeAdmins,
    suspendedAdmins,
    byDepartment,
    byRoleLevel,
  };
}

/**
 * Get dashboard statistics for admin view
 */
export async function getDashboardStats() {
  try {
    const [
      totalBits,
      activeBits,
      totalLocations,
      totalOperators,
      totalSupervisors,
      totalGeneralSupervisors,
    ] = await Promise.all([
      Beat.countDocuments(),
      Beat.countDocuments({ isActive: true }),
      Location.countDocuments(),
      Operator.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'SUPERVISOR' }),
      User.countDocuments({ role: 'GENERAL_SUPERVISOR' }),
    ]);

    return {
      totalBits,
      activeBits,
      inactiveBits: totalBits - activeBits,
      totalLocations,
      totalOperators,
      totalSupervisors,
      totalGeneralSupervisors,
      unreadMessages: 0, // TODO: Implement messaging count
      recentReports: 0, // TODO: Implement reports count
    };
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    throw new AppError('Failed to fetch dashboard statistics', 500);
  }
}

