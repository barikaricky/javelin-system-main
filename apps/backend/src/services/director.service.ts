import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { User, Supervisor } from '../models';

// Generate employee ID
function generateEmployeeId(role: string): string {
  const prefix = role === 'SUPERVISOR' ? 'MGR' : 'OPR';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Generate temporary password
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function createSupervisor(directorId: string, data: any) {
  try {
    logger.info('Creating supervisor/manager', { email: data.email, directorId });

    // Validate required fields
    if (!data.email || !data.firstName || !data.lastName) {
      throw new AppError('Email, first name, and last name are required', 400);
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      throw new AppError('A user with this email already exists', 409);
    }

    // Generate credentials
    const employeeId = generateEmployeeId('SUPERVISOR');
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Create user
    const user = await User.create({
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      firstName: data.firstName,
      lastName: data.lastName,
      employeeId,
      passportPhoto: data.passportPhoto || null,
      createdById: directorId,
    });

    // Create supervisor profile
    const supervisor = await Supervisor.create({
      userId: user._id,
      employeeId,
      fullName: data.fullName || `${data.firstName} ${data.lastName}`,
      idCard: data.idCard || '',
      address: data.address || '',
      rank: data.rank || 'Manager',
      dateOfEmployment: new Date(data.dateOfEmployment || new Date()),
      passportPhoto: data.passportPhoto || null,
      termsAccepted: true,
      salary: data.salary || 0,
    });

    logger.info('Supervisor/manager created successfully', {
      userId: user._id,
      employeeId,
      email: data.email,
    });

    // Return credentials for the client
    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
      credentials: {
        employeeId,
        password: temporaryPassword,
      },
    };
  } catch (error: any) {
    logger.error('Error creating supervisor:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to create supervisor', 500);
  }
}

export async function getSupervisors(filters?: any) {
  const query: any = {};
  
  if (filters?.approvalStatus) {
    query.approvalStatus = filters.approvalStatus;
  }
  
  if (filters?.supervisorType) {
    query.supervisorType = filters.supervisorType;
  }
  
  console.log('🔍 Supervisor query:', query);
  
  let queryBuilder = Supervisor.find(query)
    .populate({
      path: 'userId',
      select: 'email phoneNumber firstName lastName status',
    })
    .populate('locationId')
    .sort({ createdAt: -1 });
  
  if (filters?.limit) {
    queryBuilder = queryBuilder.limit(filters.limit);
  }
  
  const results = await queryBuilder.lean();
  console.log('📊 Supervisor results count:', results.length);
  console.log('📊 First supervisor sample:', results[0]);
  
  return results;
}

export async function getSupervisorById(id: string) {
  const supervisor = await Supervisor.findById(id)
    .populate('userId')
    .populate('locationId');

  if (!supervisor) {
    throw new AppError('Supervisor not found', 404);
  }

  return supervisor;
}

export async function updateSupervisor(id: string, data: any) {
  const updateData: any = {};
  if (data.locationId) updateData.locationId = data.locationId;
  if (data.salary) updateData.salary = data.salary;
  if (data.rank) updateData.rank = data.rank;

  const supervisor = await Supervisor.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );

  return supervisor;
}

export async function deleteSupervisor(id: string) {
  await Supervisor.findByIdAndDelete(id);
}
