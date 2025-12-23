import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { sendCredentialsEmail } from './email.service';
import { User, Manager, Location } from '../models';

interface RegisterManagerData {
  fullName: string;
  email: string;
  phone: string;
  department?: string;
  locationId?: string;
  startDate?: Date;
  profilePhoto?: string;
  createdById: string;
}

// Generate sequential manager ID (MGR-XXXXX)
async function generateManagerId(): Promise<string> {
  // Get the count of existing managers to generate sequential ID
  const managerCount = await Manager.countDocuments();
  const nextNumber = managerCount + 1;
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `MGR${paddedNumber}`;
}

// Generate password in format: javelin_[MGR_ID]_[RANDOM]
function generateManagerPassword(managerId: string): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 8; i++) {
    randomString += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return `javelin_${managerId}_${randomString}`;
}

// Parse full name into first and last name
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ') || parts[0];
  return { firstName, lastName };
}

export async function registerManager(data: RegisterManagerData) {
  try {
    logger.info('Registering new manager', { email: data.email, createdBy: data.createdById });

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });

    if (existingUser) {
      throw new AppError('This email is already registered', 409);
    }

    // Generate manager ID and password
    const managerId = await generateManagerId();
    const temporaryPassword = generateManagerPassword(managerId);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Parse full name
    const { firstName, lastName } = parseFullName(data.fullName);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      passwordHash: hashedPassword,
      role: 'MANAGER',
      status: 'ACTIVE',
      profilePhoto: data.profilePhoto || null,
      employeeId: managerId,
      createdById: data.createdById,
    });

    // Create manager profile
    const manager = await Manager.create({
      userId: user._id,
      employeeId: managerId,
      locationId: data.locationId || null,
      department: data.department || null,
      startDate: data.startDate || new Date(),
      createdById: data.createdById,
    });

    logger.info('Manager account created successfully', {
      userId: user._id,
      managerId,
      email: data.email,
    });

    // Try to send credentials email
    let emailSent = false;
    try {
      await sendCredentialsEmail({
        email: data.email,
        firstName,
        username: data.email,
        password: temporaryPassword,
      });
      emailSent = true;
      logger.info('Credentials email sent successfully', { email: data.email });
    } catch (emailError) {
      logger.error('Failed to send credentials email', { email: data.email, error: emailError });
    }

    return {
      success: true,
      manager: {
        id: manager._id,
        managerId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        department: manager.department,
        startDate: manager.startDate,
        profilePhoto: user.profilePhoto,
        status: user.status,
      },
      credentials: {
        email: user.email,
        password: temporaryPassword,
      },
      emailSent,
    };
  } catch (error: any) {
    logger.error('Error registering manager:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to register manager', 500);
  }
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  return !existingUser;
}

export async function getLocations() {
  // Fetch actual locations from database
  const locations = await Location.find({ isActive: true })
    .select('name address region')
    .sort({ name: 1 });
  return locations;
}

export async function getManagerById(managerId: string) {
  const manager = await Manager.findById(managerId)
    .populate({
      path: 'userId',
      select: 'email firstName lastName phone profilePhoto status employeeId',
    })
    .populate({
      path: 'locationId',
      select: 'name address',
    });

  if (!manager) {
    throw new AppError('Manager not found', 404);
  }

  return {
    id: manager._id,
    managerId: manager.employeeId,
    email: (manager.userId as any).email,
    firstName: (manager.userId as any).firstName,
    lastName: (manager.userId as any).lastName,
    fullName: `${(manager.userId as any).firstName} ${(manager.userId as any).lastName}`,
    phone: (manager.userId as any).phone,
    profilePhoto: (manager.userId as any).profilePhoto,
    department: manager.department,
    location: manager.locationId,
    startDate: manager.startDate,
    status: (manager.userId as any).status,
  };
}

export async function getAllManagers() {
  const managers = await Manager.find()
    .populate({
      path: 'userId',
      select: 'email firstName lastName phone profilePhoto status employeeId',
    })
    .populate({
      path: 'locationId',
      select: 'name',
    })
    .sort({ createdAt: -1 });

  return managers.map((manager) => ({
    id: manager._id,
    managerId: manager.employeeId,
    email: (manager.userId as any).email,
    firstName: (manager.userId as any).firstName,
    lastName: (manager.userId as any).lastName,
    fullName: `${(manager.userId as any).firstName} ${(manager.userId as any).lastName}`,
    phone: (manager.userId as any).phone,
    profilePhoto: (manager.userId as any).profilePhoto,
    department: manager.department,
    location: (manager.locationId as any)?.name || null,
    startDate: manager.startDate,
    status: (manager.userId as any).status,
  }));
}
