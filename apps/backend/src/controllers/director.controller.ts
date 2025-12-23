import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generatePassword, generateUsername } from '../utils/credentials.util';
import { sendCredentialsEmail } from '../services/email.service';
import { prisma } from '../utils/database';
import { uploadProfilePicture } from '../utils/file.util';

export const registerManager = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, role, department, startDate } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Generate credentials
    const username = generateUsername(firstName, lastName);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle profile picture upload
    let profilePictureUrl = null;
    if (req.file) {
      profilePictureUrl = await uploadProfilePicture(req.file);
    }

    // Generate employee ID
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const employeeId = `MGR-${timestamp}-${random}`;

    // Create manager - using passwordHash instead of password
    const manager = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        firstName,
        lastName,
        email,
        phone,
        employeeId,
        passwordHash: hashedPassword,
        role: 'SUPERVISOR',
        status: 'ACTIVE',
        profilePhoto: profilePictureUrl,
      },
    });

    // Send credentials email
    await sendCredentialsEmail({
      email: manager.email,
      firstName: manager.firstName,
      username: employeeId,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Manager registered successfully',
      data: {
        id: manager.id,
        firstName: manager.firstName,
        lastName: manager.lastName,
        email: manager.email,
        employeeId: manager.employeeId,
        role: manager.role,
        profilePicture: manager.profilePhoto,
      },
    });
  } catch (error) {
    console.error('Register manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register manager',
    });
  }
};

export const getManagers = async (req: Request, res: Response) => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        employeeId: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: managers,
      total: managers.length,
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers',
    });
  }
};
