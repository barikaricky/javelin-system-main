import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { generateEmployeeId, generateTemporaryPassword, generateUsername } from '../utils/credentials.util';
import { notifyDirectorsOfNewSupervisor, notifyManagerOfApprovalResult, notifyGeneralSupervisorOfApprovalResult } from './notification.service';
import { logActivity } from './activity.service';
import { User, Supervisor, Location, Operator } from '../models';
import mongoose from 'mongoose';

// Interface for common supervisor registration data
interface BaseSupervisorData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: Date;
  address: string;
  state: string;
  lga: string;
  nationalId?: string;
  passportPhoto?: string;
  
  // Work Information
  supervisorType: SupervisorType;
  startDate: Date;
  
  // Salary Information
  salary: number;
  salaryCategory: string;
  allowance?: number;
  bankName: string;
  bankAccountNumber: string;
}

// Interface for General Supervisor specific data
interface GeneralSupervisorData extends BaseSupervisorData {
  supervisorType: 'GENERAL_SUPERVISOR';
  
  // Region/Zone Management
  regionAssigned: string;
  subordinateSupervisorIds?: string[];
  
  // Performance/Responsibility
  expectedVisitFrequency: string;
  reportSubmissionType: string;
  escalationRights: string;
}

// Interface for Supervisor specific data
interface SupervisorData extends BaseSupervisorData {
  supervisorType: 'SUPERVISOR';
  
  // Work Assignment
  locationId?: string;
  locationsAssigned: string[];
  bitsAssigned: string[];
  generalSupervisorId?: string;
  
  // Duties & Schedule
  visitSchedule: string;
  shiftType: string;
  
  // Transportation
  isMotorbikeOwner?: boolean;
  transportAllowanceEligible?: boolean;
}

type SupervisorRegistrationData = GeneralSupervisorData | SupervisorData;

export async function registerSupervisor(data: any, managerId: string) {
  try {
    logger.info('Starting supervisor registration', { 
      email: data.email, 
      supervisorType: data.supervisorType,
      managerId 
    });

    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      throw new AppError('A user with this email already exists', 400);
    }

    if (data.phone) {
      const existingPhone = await User.findOne({ phone: data.phone });
      if (existingPhone) {
        throw new AppError('A user with this phone number already exists', 400);
      }
    }

    const employeeId = generateEmployeeId(
      data.supervisorType === 'GENERAL_SUPERVISOR' ? 'GS' : 'SPV'
    );
    const username = generateUsername(data.firstName, data.lastName);
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const userRole = data.supervisorType === 'GENERAL_SUPERVISOR' ? 'GENERAL_SUPERVISOR' : 'SUPERVISOR';

    try {
      const user = await User.create({
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        role: userRole,
        status: 'PENDING',
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        state: data.state,
        lga: data.lga,
        employeeId: employeeId,
        passportPhoto: data.passportPhoto,
        bankName: data.bankName,
        accountNumber: data.bankAccountNumber,
        accountName: `${data.firstName} ${data.lastName}`,
        monthlySalary: data.salary,
        createdById: managerId,
      });

      const supervisor = await Supervisor.create({
        userId: user._id,
        employeeId: employeeId,
        fullName: `${data.firstName} ${data.lastName}`,
        salary: data.salary,
        salaryCategory: data.salaryCategory,
        allowance: data.allowance,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        address: data.address,
        dateOfEmployment: new Date(data.startDate),
        startDate: new Date(data.startDate),
        passportPhoto: data.passportPhoto,
        nationalId: data.nationalId,
        supervisorType: data.supervisorType,
        mustResetPassword: true,
        approvalStatus: 'PENDING',
        rawPassword: temporaryPassword,
        regionAssigned: data.regionAssigned,
        locationsAssigned: data.locationsAssigned || [],
        bitsAssigned: data.bitsAssigned || [],
      });

      await notifyDirectorsOfNewSupervisor(
        supervisor._id.toString(),
        supervisor.fullName,
        data.supervisorType,
        managerId
      );

      await logActivity(
        managerId,
        'SUPERVISOR_REGISTERED',
        'supervisor',
        supervisor._id.toString(),
        {
          supervisorName: supervisor.fullName,
          supervisorType: data.supervisorType,
          email: data.email,
        }
      );

      logger.info('Supervisor registered successfully (pending approval)', {
        userId: user._id,
        supervisorId: supervisor._id,
        employeeId,
        supervisorType: data.supervisorType,
        approvalStatus: 'PENDING',
      });

      return {
        user: user,
        supervisor: supervisor,
        credentials: {
          username,
          employeeId,
          temporaryPassword: '**PENDING APPROVAL**',
          email: data.email,
        },
      };
    } catch (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Supervisor registration error:', error);
    throw error;
  }
}

// Get all supervisors with counts
export async function getAllSupervisors(filters?: any) {
  try {
    const where: any = {};

    if (filters?.supervisorType) {
      where.supervisorType = filters.supervisorType;
    }
    if (filters?.regionAssigned) {
      where.regionAssigned = filters.regionAssigned;
    }
    if (filters?.generalSupervisorId) {
      where.generalSupervisorId = filters.generalSupervisorId;
    }
    if (filters?.approvalStatus) {
      where.approvalStatus = filters.approvalStatus;
    }

    const supervisors = await Supervisor.find(where)
      .populate({
        path: 'userId',
        select: 'email phone firstName lastName status profilePhoto passportPhoto',
      })
      .populate('locationId')
      .populate({
        path: 'generalSupervisorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName',
        },
      })
      .sort({ createdAt: -1 });

    const supervisorsWithCounts = await Promise.all(
      supervisors.map(async (sup) => {
        const operatorCount = await Operator.countDocuments({ supervisorId: sup._id });
        const subordinateCount = await Supervisor.countDocuments({ generalSupervisorId: sup._id });
        
        const supObj = sup.toObject();
        
        // Map userId to users for frontend compatibility
        return {
          ...supObj,
          id: supObj._id.toString(),
          users: supObj.userId,
          locations: supObj.locationId,
          generalSupervisor: supObj.generalSupervisorId ? {
            id: supObj.generalSupervisorId._id,
            users: supObj.generalSupervisorId.userId,
          } : undefined,
          operatorCount,
          subordinateSupervisorCount: subordinateCount,
        };
      })
    );

    return supervisorsWithCounts;
  } catch (error) {
    logger.error('Get all supervisors error:', error);
    throw error;
  }
}

// Get supervisor by ID
export async function getSupervisorById(id: string) {
  try {
    const supervisor = await Supervisor.findById(id)
      .populate({
        path: 'userId',
        select: 'email phone firstName lastName status profilePhoto passportPhoto gender dateOfBirth state lga address',
      })
      .populate('locationId')
      .populate({
        path: 'generalSupervisorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email',
        },
      });

    if (!supervisor) {
      throw new AppError('Supervisor not found', 404);
    }

    const [subordinateSupervisors, operators] = await Promise.all([
      Supervisor.find({ generalSupervisorId: supervisor._id }).populate({
        path: 'userId',
        select: 'firstName lastName email status profilePhoto passportPhoto',
      }),
      Operator.find({ supervisorId: supervisor._id }).populate({
        path: 'userId',
        select: 'firstName lastName email status profilePhoto passportPhoto',
      }),
    ]);

    const supObj = supervisor.toObject();
    
    return {
      ...supObj,
      id: supObj._id.toString(),
      users: supObj.userId,
      locations: supObj.locationId,
      generalSupervisor: supObj.generalSupervisorId ? {
        id: supObj.generalSupervisorId._id,
        users: supObj.generalSupervisorId.userId,
      } : undefined,
      subordinateSupervisors: subordinateSupervisors.map(sub => ({
        ...sub.toObject(),
        id: sub._id.toString(),
        users: sub.userId,
      })),
      operators: operators.map(op => ({
        ...op.toObject(),
        id: op._id.toString(),
        users: op.userId,
      })),
      _count: {
        operators: operators.length,
        subordinateSupervisors: subordinateSupervisors.length,
      },
    };
  } catch (error) {
    logger.error('Get supervisor by ID error:', error);
    throw error;
  }
}

// Get all General Supervisors (for dropdown when registering a Supervisor)
export async function getGeneralSupervisors() {
  try {
    const generalSupervisors = await Supervisor.find({
      supervisorType: 'GENERAL_SUPERVISOR',
    }).populate({
      path: 'userId',
      match: { status: 'ACTIVE' },
      select: 'firstName lastName email',
    });

    const supervisorsWithCounts = await Promise.all(
      generalSupervisors.map(async (gs) => {
        const subordinateCount = await Supervisor.countDocuments({
          generalSupervisorId: gs._id,
        });
        return {
          ...gs.toObject(),
          _count: { subordinateSupervisors: subordinateCount },
        };
      })
    );

    return supervisorsWithCounts.filter(s => s.userId);
  } catch (error) {
    logger.error('Get general supervisors error:', error);
    throw error;
  }
}

// Get supervisors under a General Supervisor
export async function getSupervisorsUnderGeneralSupervisor(generalSupervisorId: string) {
  try {
    const supervisors = await Supervisor.find({
      generalSupervisorId,
      supervisorType: 'SUPERVISOR',
    })
      .populate({
        path: 'userId',
        select: 'firstName lastName email status',
      })
      .populate('locationId');

    const supervisorsWithCounts = await Promise.all(
      supervisors.map(async (sup) => {
        const operatorCount = await Operator.countDocuments({ supervisorId: sup._id });
        return {
          ...sup.toObject(),
          _count: { operators: operatorCount },
        };
      })
    );

    return supervisorsWithCounts;
  } catch (error) {
    logger.error('Get supervisors under general supervisor error:', error);
    throw error;
  }
}

// Update supervisor assignment (assign supervisor to general supervisor)
export async function assignSupervisorToGeneralSupervisor(
  supervisorId: string,
  generalSupervisorId: string | null
) {
  try {
    const supervisor = await Supervisor.findById(supervisorId);

    if (!supervisor) {
      throw new AppError('Supervisor not found', 404);
    }

    if (supervisor.supervisorType === 'GENERAL_SUPERVISOR') {
      throw new AppError('Cannot assign a General Supervisor to another General Supervisor', 400);
    }

    if (generalSupervisorId) {
      const generalSupervisor = await Supervisor.findById(generalSupervisorId);

      if (!generalSupervisor || generalSupervisor.supervisorType !== 'GENERAL_SUPERVISOR') {
        throw new AppError('Invalid General Supervisor', 400);
      }
    }

    const updated = await Supervisor.findByIdAndUpdate(
      supervisorId,
      { generalSupervisorId },
      { new: true }
    );

    return updated;
  } catch (error) {
    logger.error('Assign supervisor to general supervisor error:', error);
    throw error;
  }
}

// Get available locations for assignment
export async function getAvailableLocations() {
  try {
    const locations = await Location.find({ isActive: true })
      .select('locationName city state address')
      .sort({ locationName: 1 });

    return { locations };
  } catch (error) {
    logger.error('Get available locations error:', error);
    throw error;
  }
}

// Get supervisor statistics for manager dashboard
export async function getSupervisorStats() {
  try {
    const [
      totalSupervisors,
      generalSupervisorCount,
      supervisorCount,
      pendingSupervisors,
    ] = await Promise.all([
      Supervisor.countDocuments(),
      Supervisor.countDocuments({ supervisorType: 'GENERAL_SUPERVISOR' }),
      Supervisor.countDocuments({ supervisorType: 'SUPERVISOR' }),
      Supervisor.countDocuments({ approvalStatus: 'PENDING' }),
    ]);

    const activeSupervisors = await Supervisor.find({ approvalStatus: 'APPROVED' })
      .populate({ path: 'userId', match: { status: 'ACTIVE' } });
    
    const activeCount = activeSupervisors.filter(s => s.userId).length;

    return {
      total: totalSupervisors,
      generalSupervisors: generalSupervisorCount,
      supervisors: supervisorCount,
      active: activeCount,
      inactive: totalSupervisors - activeCount,
      pending: pendingSupervisors,
    };
  } catch (error) {
    logger.error('Get supervisor stats error:', error);
    throw error;
  }
}

// Get pending supervisor approvals (for Director)
export async function getPendingSupervisorApprovals() {
  try {
    const pendingSupervisors = await Supervisor.find({
      approvalStatus: 'PENDING',
    })
      .populate({
        path: 'userId',
        select: 'email phone phoneNumber firstName lastName status passportPhoto profilePhoto createdById createdAt',
      })
      .populate({
        path: 'locationId',
        select: 'name address',
      })
      .populate({
        path: 'generalSupervisorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName',
        },
      })
      .select('fullName employeeId supervisorType approvalStatus createdAt regionAssigned shiftType visitSchedule salary salaryCategory userId locationId generalSupervisorId')
      .sort({ createdAt: -1 });

    const supervisorsWithManager = await Promise.all(
      pendingSupervisors.map(async (sup) => {
        let registeredBy = null;
        const user = sup.userId as any;
        if (user?.createdById) {
          const manager = await User.findById(user.createdById).select('firstName lastName email');
          registeredBy = manager;
        }
        return {
          ...sup.toObject(),
          registeredBy,
        };
      })
    );

    return supervisorsWithManager;
  } catch (error) {
    logger.error('Get pending supervisor approvals error:', error);
    throw error;
  }
}

// Approve supervisor registration (Director for GS, Manager for Supervisors)
export async function approveSupervisor(supervisorId: string, approverId: string) {
  try {
    const supervisor = await Supervisor.findById(supervisorId).populate({
      path: 'userId',
      select: 'email createdById',
    }).populate({
      path: 'generalSupervisorId',
      populate: { path: 'userId', select: '_id' },
    });

    if (!supervisor) {
      throw new AppError('Supervisor not found', 404);
    }

    if (supervisor.approvalStatus !== 'PENDING') {
      throw new AppError('Supervisor is not pending approval', 400);
    }

    const rawPassword = supervisor.rawPassword;
    const user = supervisor.userId as any;

    await Supervisor.findByIdAndUpdate(
      supervisorId,
      {
        approvalStatus: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
        rawPassword: null,
      }
    );

    await User.findByIdAndUpdate(
      user._id,
      { status: 'ACTIVE' }
    );

    const updatedSupervisor = await Supervisor.findById(supervisorId).populate('userId');

    if (rawPassword) {
      const credentials = {
        employeeId: updatedSupervisor!.employeeId,
        email: user.email,
        temporaryPassword: rawPassword,
      };

      if (supervisor.supervisorType === 'SUPERVISOR' && supervisor.generalSupervisorId) {
        const gs = supervisor.generalSupervisorId as any;
        await notifyGeneralSupervisorOfApprovalResult(
          gs.userId._id.toString(),
          supervisorId,
          updatedSupervisor!.fullName,
          true,
          approverId,
          credentials
        );
      } else if (user.createdById) {
        await notifyManagerOfApprovalResult(
          user.createdById,
          supervisorId,
          updatedSupervisor!.fullName,
          updatedSupervisor!.supervisorType as 'GENERAL_SUPERVISOR' | 'SUPERVISOR',
          true,
          approverId,
          credentials
        );
      }
    }

    await logActivity(
      approverId,
      'SUPERVISOR_APPROVED',
      'supervisor',
      supervisorId,
      {
        supervisorName: updatedSupervisor!.fullName,
        supervisorType: updatedSupervisor!.supervisorType,
      }
    );

    logger.info('Supervisor approved', { supervisorId, approverId });

    return {
      supervisor: updatedSupervisor,
      credentials: rawPassword ? {
        employeeId: updatedSupervisor!.employeeId,
        email: user.email,
        temporaryPassword: rawPassword,
      } : null,
    };
  } catch (error) {
    logger.error('Approve supervisor error:', error);
    throw error;
  }
}

// Reject supervisor registration (Director for GS, Manager for Supervisors)
export async function rejectSupervisor(
  supervisorId: string,
  rejecterId: string,
  rejectionReason: string
) {
  try {
    const supervisor = await Supervisor.findById(supervisorId).populate({
      path: 'userId',
      select: 'email createdById',
    }).populate({
      path: 'generalSupervisorId',
      populate: { path: 'userId', select: '_id' },
    });

    if (!supervisor) {
      throw new AppError('Supervisor not found', 404);
    }

    if (supervisor.approvalStatus !== 'PENDING') {
      throw new AppError('Supervisor is not pending approval', 400);
    }

    const user = supervisor.userId as any;

    const updatedSupervisor = await Supervisor.findByIdAndUpdate(
      supervisorId,
      {
        approvalStatus: 'REJECTED',
        approvedById: rejecterId,
        approvedAt: new Date(),
        rejectionReason,
        rawPassword: null,
      },
      { new: true }
    ).populate('userId');

    await User.findByIdAndUpdate(user._id, { status: 'INACTIVE' });

    if (supervisor.supervisorType === 'SUPERVISOR' && supervisor.generalSupervisorId) {
      const gs = supervisor.generalSupervisorId as any;
      await notifyGeneralSupervisorOfApprovalResult(
        gs.userId._id.toString(),
        supervisorId,
        updatedSupervisor!.fullName,
        false,
        rejecterId,
        undefined,
        rejectionReason
      );
    } else if (user.createdById) {
      await notifyManagerOfApprovalResult(
        user.createdById,
        supervisorId,
        updatedSupervisor!.fullName,
        updatedSupervisor!.supervisorType as 'GENERAL_SUPERVISOR' | 'SUPERVISOR',
        false,
        rejecterId,
        undefined,
        rejectionReason
      );
    }

    await logActivity(
      rejecterId,
      'SUPERVISOR_REJECTED',
      'supervisor',
      supervisorId,
      {
        supervisorName: updatedSupervisor!.fullName,
        supervisorType: updatedSupervisor!.supervisorType,
        rejectionReason,
      }
    );

    logger.info('Supervisor rejected', { supervisorId, rejecterId, reason: rejectionReason });

    return updatedSupervisor;
  } catch (error) {
    logger.error('Reject supervisor error:', error);
    throw error;
  }
}

// Get approval statistics for Director dashboard
export async function getApprovalStats() {
  try {
    const [
      pendingCount,
      approvedCount,
      rejectedCount,
      pendingGeneral,
      pendingSupervisor,
    ] = await Promise.all([
      Supervisor.countDocuments({ approvalStatus: 'PENDING' }),
      Supervisor.countDocuments({ approvalStatus: 'APPROVED' }),
      Supervisor.countDocuments({ approvalStatus: 'REJECTED' }),
      Supervisor.countDocuments({
        approvalStatus: 'PENDING',
        supervisorType: 'GENERAL_SUPERVISOR',
      }),
      Supervisor.countDocuments({
        approvalStatus: 'PENDING',
        supervisorType: 'SUPERVISOR',
      }),
    ]);

    return {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      pendingGeneral,
      pendingSupervisor,
    };
  } catch (error) {
    logger.error('Get approval stats error:', error);
    throw error;
  }
}
