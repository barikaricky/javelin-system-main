import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole, Director, Manager, Supervisor, Operator, Secretary, Admin } from '../models';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { logActivity } from './activity.service';

export async function login(email: string, password: string, ipAddress?: string, userAgent?: string) {
  try {
    logger.info('Processing login', { email });

    // Check if database is connected
    if (!User.db || User.db.readyState !== 1) {
      logger.error('Database not connected during login attempt');
      throw new AppError('Database connection error. Please try again in a moment.', 503);
    }

    const user = await User.findOne({ email }).exec();

    if (!user) {
      logger.warn('Login failed: User not found', { email });
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user has a password hash (using correct field name)
    if (!user.passwordHash) {
      logger.error('User has no password hash', { email, userId: user._id });
      throw new AppError('Account not properly configured. Please reset your password or contact support.', 500);
    }

    // Check if user account is active
    if (user.status === 'PENDING') {
      logger.warn('Login failed: Account pending approval', { email, userId: user._id });
      throw new AppError('Your account is pending approval. Please wait for approval before logging in.', 401);
    }

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      logger.warn('Login failed: Account inactive/suspended', { email, userId: user._id, status: user.status });
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn('Login failed: Invalid password', { email });
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      {
        userId: user._id.toString(),
        type: 'refresh',
      },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    // Log the login activity and update lastLogin in the background (non-blocking)
    // These are fire-and-forget operations to speed up login response
    const backgroundTasks = [
      logActivity(
        user._id.toString(),
        'LOGIN',
        'user',
        user._id.toString(),
        { role: user.role },
        ipAddress,
        userAgent
      ),
      User.updateOne(
        { _id: user._id },
        { lastLogin: new Date() }
      )
    ];

    // If admin, also log the admin login
    if (user.role === 'ADMIN') {
      const { logAdminLogin } = await import('./admin.service');
      backgroundTasks.push(
        logAdminLogin(
          user._id.toString(),
          ipAddress || 'unknown',
          userAgent || 'unknown',
          true
        )
      );
    }

    Promise.all(backgroundTasks).catch(err => {
      logger.error('Background login operations failed:', err);
    });

    logger.info('Login successful', { userId: user._id, role: user.role });

    return {
      token,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto || user.passportPhoto,
      },
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  address?: string;
}) {
  try {
    logger.info('Processing registration', { email: data.email, role: data.role });

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email }).exec();

    if (existingUser) {
      logger.warn('Registration failed: User already exists', { email: data.email });
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with passwordHash field
    const user = await User.create({
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    });

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    logger.info('Registration successful', { userId: user._id, email: user.email });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
}

export async function getCurrentUser(userId: string) {
  try {
    const user = await User.findById(userId).exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get role-specific data
    let roleData = null;
    if (user.role === 'MANAGER') {
      roleData = await Manager.findOne({ userId: user._id }).exec();
    } else if (user.role === 'DIRECTOR') {
      roleData = await Director.findOne({ userId: user._id }).exec();
    } else if (user.role === 'SUPERVISOR' || user.role === 'GENERAL_SUPERVISOR') {
      roleData = await Supervisor.findOne({ userId: user._id }).exec();
    } else if (user.role === 'OPERATOR') {
      roleData = await Operator.findOne({ userId: user._id }).exec();
    } else if (user.role === 'SECRETARY') {
      roleData = await Secretary.findOne({ userId: user._id }).exec();
    } else if (user.role === 'ADMIN') {
      roleData = await Admin.findOne({ userId: user._id })
        .populate('officeLocationId', 'locationName city state')
        .exec();
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      status: user.status,
      profilePhoto: user.profilePhoto || user.passportPhoto,
      passportPhoto: user.passportPhoto,
      employeeId: user.employeeId,
      createdAt: user.createdAt,
      ...roleData?.toObject(),
    };
  } catch (error) {
    logger.error('Get current user error:', error);
    throw error;
  }
}
