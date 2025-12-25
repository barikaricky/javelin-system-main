import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { generateEmployeeId, generateTemporaryPassword, generateUsername } from '../utils/credentials.util';
import { logActivity } from './activity.service';
import { User, Secretary } from '../models';

interface SecretaryRegistrationData {
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
  startDate: Date;
  
  // Salary Information
  salary: number;
  salaryCategory: string;
  bankName: string;
  bankAccountNumber: string;
  
  // Regional Assignment
  regionAssigned?: string;
}

export async function registerSecretary(data: SecretaryRegistrationData, managerId: string) {
  try {
    logger.info('Starting secretary registration', { 
      email: data.email, 
      managerId 
    });

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      throw new AppError('A user with this email already exists', 400);
    }

    // Check if phone already exists
    if (data.phone) {
      const existingPhone = await User.findOne({ phone: data.phone });
      if (existingPhone) {
        throw new AppError('A user with this phone number already exists', 400);
      }
    }

    // Generate credentials
    const employeeId = generateEmployeeId('SEC');
    const username = generateUsername(data.firstName, data.lastName);
    const temporaryPassword = generateTemporaryPassword();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user
    const user = await User.create({
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
      role: 'SECRETARY',
      status: 'ACTIVE',
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

    // Create secretary record
    const secretary = await Secretary.create({
      userId: user._id,
      employeeId: employeeId,
      fullName: `${data.firstName} ${data.lastName}`,
      salary: data.salary,
      salaryCategory: data.salaryCategory,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      address: data.address,
      dateOfEmployment: new Date(data.startDate),
      startDate: new Date(data.startDate),
      passportPhoto: data.passportPhoto,
      nationalId: data.nationalId,
      regionAssigned: data.regionAssigned,
    });

    // Log the activity (non-blocking - don't fail registration if this fails)
    try {
      await logActivity(
        managerId,
        'SECRETARY_REGISTERED',
        'secretary',
        secretary._id.toString(),
        {
          secretaryName: secretary.fullName,
          email: data.email,
        }
      );
      logger.info('Activity logged successfully');
    } catch (activityError) {
      logger.error('Failed to log activity (non-critical):', activityError);
      // Don't throw - activity logging failure shouldn't fail the registration
    }

    logger.info('Secretary registered successfully', {
      userId: user._id,
      secretaryId: secretary._id,
      employeeId: employeeId,
      temporaryPassword: temporaryPassword, // Log for debugging
    });

    return {
      user,
      secretary,
      credentials: {
        username,
        employeeId,
        temporaryPassword,
        email: data.email,
      },
    };
  } catch (error) {
    logger.error('Register secretary error:', error);
    throw error;
  }
}

export async function getAllSecretaries() {
  try {
    const secretaries = await Secretary.find()
      .populate({
        path: 'userId',
        select: 'email firstName lastName phone status passportPhoto createdAt',
      })
      .sort({ createdAt: -1 });

    return secretaries;
  } catch (error) {
    logger.error('Get all secretaries error:', error);
    throw error;
  }
}

export async function getSecretaryById(secretaryId: string) {
  try {
    const secretary = await Secretary.findById(secretaryId)
      .populate({
        path: 'userId',
        select: 'email firstName lastName phone status passportPhoto createdAt',
      });

    if (!secretary) {
      throw new AppError('Secretary not found', 404);
    }

    return secretary;
  } catch (error) {
    logger.error('Get secretary by ID error:', error);
    throw error;
  }
}

export async function updateSecretary(secretaryId: string, data: Partial<SecretaryRegistrationData>) {
  try {
    const secretary = await Secretary.findById(secretaryId).populate('userId');

    if (!secretary) {
      throw new AppError('Secretary not found', 404);
    }

    // Update user fields
    const userUpdate: any = {};
    if (data.firstName) userUpdate.firstName = data.firstName;
    if (data.lastName) userUpdate.lastName = data.lastName;
    if (data.phone) userUpdate.phone = data.phone;
    if (data.gender) userUpdate.gender = data.gender;
    if (data.dateOfBirth) userUpdate.dateOfBirth = new Date(data.dateOfBirth);
    if (data.state) userUpdate.state = data.state;
    if (data.lga) userUpdate.lga = data.lga;
    if (data.passportPhoto) userUpdate.passportPhoto = data.passportPhoto;
    if (data.bankName) userUpdate.bankName = data.bankName;
    if (data.bankAccountNumber) userUpdate.accountNumber = data.bankAccountNumber;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(secretary.userId, userUpdate);
    }

    // Update secretary fields
    const secretaryUpdate: any = {};
    if (data.firstName && data.lastName) {
      secretaryUpdate.fullName = `${data.firstName} ${data.lastName}`;
    }
    if (data.salary) secretaryUpdate.salary = data.salary;
    if (data.salaryCategory) secretaryUpdate.salaryCategory = data.salaryCategory;
    if (data.bankName) secretaryUpdate.bankName = data.bankName;
    if (data.bankAccountNumber) secretaryUpdate.bankAccountNumber = data.bankAccountNumber;
    if (data.address) secretaryUpdate.address = data.address;
    if (data.passportPhoto) secretaryUpdate.passportPhoto = data.passportPhoto;
    if (data.nationalId) secretaryUpdate.nationalId = data.nationalId;
    if (data.regionAssigned) secretaryUpdate.regionAssigned = data.regionAssigned;

    const updatedSecretary = await Secretary.findByIdAndUpdate(
      secretaryId,
      secretaryUpdate,
      { new: true }
    ).populate('userId');

    logger.info('Secretary updated successfully', { secretaryId });
    return { user: (updatedSecretary as any).userId, secretary: updatedSecretary };
  } catch (error) {
    logger.error('Update secretary error:', error);
    throw error;
  }
}

export async function deleteSecretary(secretaryId: string) {
  try {
    const secretary = await Secretary.findById(secretaryId);

    if (!secretary) {
      throw new AppError('Secretary not found', 404);
    }

    // Delete secretary
    await Secretary.findByIdAndDelete(secretaryId);

    logger.info('Secretary deleted successfully', { secretaryId });
    return { message: 'Secretary deleted successfully' };
  } catch (error) {
    logger.error('Delete secretary error:', error);
    throw error;
  }
}

export async function getSecretaryStats() {
  try {
    const totalSecretaries = await Secretary.countDocuments();
    
    // Get secretaries with active users
    const activeSecretaries = await Secretary.find()
      .populate({
        path: 'userId',
        match: { status: 'ACTIVE' },
      });
    
    const activeCount = activeSecretaries.filter(s => (s.userId as any)?.status === 'ACTIVE').length;

    return {
      totalSecretaries,
      activeSecretaries: activeCount,
      inactiveSecretaries: totalSecretaries - activeCount,
    };
  } catch (error) {
    logger.error('Get secretary stats error:', error);
    throw error;
  }
}
