import bcrypt from 'bcryptjs';
import { User, Director } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { generateEmployeeId, generateTemporaryPassword } from '../utils/credentials.util';

interface DirectorOnboardingData {
  developerToken: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export async function createDirector(data: DirectorOnboardingData) {
  try {
    const validToken = process.env.DEVELOPER_ONBOARDING_TOKEN;
    
    if (!validToken || data.developerToken !== validToken) {
      logger.warn('Invalid developer token attempted', { email: data.email });
      throw new AppError('Invalid developer token', 403);
    }

    const existingDirector = await Director.findOne();
    if (existingDirector) {
      throw new AppError('A director account already exists in the system', 409);
    }

    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('A user with this email already exists', 409);
    }

    const employeeId = generateEmployeeId('DIR');
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await User.create({
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash: hashedPassword,
      role: 'DIRECTOR',
      status: 'ACTIVE',
      firstName: data.firstName,
      lastName: data.lastName,
      employeeId,
      mustResetPassword: true,
    });

    const director = await Director.create({
      userId: user._id,
      employeeId,
    });

    logger.info('Director account created successfully', {
      userId: user._id,
      directorId: director._id,
      email: data.email,
    });

    const response = {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
      temporaryPassword,
    };

    logger.info('Returning director credentials:', {
      hasUser: !!response.user,
      hasPassword: !!response.temporaryPassword,
      employeeId: response.user.employeeId,
    });

    return response;
  } catch (error) {
    logger.error('Create director error:', error);
    throw error;
  }
}

export async function getDirector() {
  try {
    const director = await Director.findOne().populate({
      path: 'userId',
      select: 'email firstName lastName phone status profilePhoto employeeId',
    });

    return director;
  } catch (error) {
    logger.error('Get director error:', error);
    throw error;
  }
}
