import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/error.middleware';
import {
  createRegistrationRequest,
  getPendingRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  getApprovalStats,
  getRequestingManagers,
} from '../services/registration-request.service';

// Local enum types (matching Mongoose model)
type RegistrationRole = 'SUPERVISOR' | 'HR' | 'SECRETARY' | 'GENERAL_SUPERVISOR' | 'GUARD';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const router = Router();

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/requests');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `request-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP files are allowed'));
    }
  },
});

// Get pending requests with filters (Director only)
router.get('/pending', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Only directors can view pending approvals
    if (req.user?.role !== 'DIRECTOR') {
      throw new AppError('Only directors can view pending approvals', 403);
    }

    const { role, status, requestedById, locationId, dateFrom, dateTo } = req.query;

    const filters: any = {};

    if (role && Object.values(RegistrationRole).includes(role as RegistrationRole)) {
      filters.role = role as RegistrationRole;
    }

    if (status && Object.values(RequestStatus).includes(status as RequestStatus)) {
      filters.status = status as RequestStatus;
    }

    if (requestedById) {
      filters.requestedById = requestedById as string;
    }

    if (locationId) {
      filters.locationId = locationId as string;
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom as string);
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo as string);
    }

    const result = await getPendingRequests(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get approval statistics (Director only)
router.get('/stats', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'DIRECTOR') {
      throw new AppError('Only directors can view approval statistics', 403);
    }

    const stats = await getApprovalStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
});

// Get requesting managers list (for filter dropdown)
router.get('/managers', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'DIRECTOR') {
      throw new AppError('Only directors can view this data', 403);
    }

    const managers = await getRequestingManagers();
    res.json({ success: true, managers });
  } catch (error) {
    next(error);
  }
});

// Get a single request by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = await getRequestById(req.params.id);
    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
});

// Create a new registration request (Manager only)
router.post(
  '/',
  authenticate,
  upload.single('profilePhoto'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Only managers can create registration requests
      if (req.user?.role !== 'MANAGER') {
        throw new AppError('Only managers can create registration requests', 403);
      }

      // Get the manager's ID
      const { prisma } = await import('../utils/database');
      const manager = await prisma.managers.findUnique({
        where: { userId: req.user.userId },
      });

      if (!manager) {
        throw new AppError('Manager profile not found', 404);
      }

      const {
        fullName,
        email,
        phone,
        role,
        locationId,
        department,
        startDate,
        dateOfBirth,
        gender,
        address,
        employmentType,
        shift,
        managerComments,
      } = req.body;

      // Validation
      if (!fullName || fullName.trim().length < 3) {
        throw new AppError('Full name must be at least 3 characters', 400);
      }

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError('Please enter a valid email address', 400);
      }

      if (!phone) {
        throw new AppError('Phone number is required', 400);
      }

      if (!role || !Object.values(RegistrationRole).includes(role as RegistrationRole)) {
        throw new AppError('Valid role is required', 400);
      }

      // Profile photo path
      const profilePhoto = req.file ? `/uploads/requests/${req.file.filename}` : undefined;

      const result = await createRegistrationRequest({
        requestedById: manager.id,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone,
        role: role as RegistrationRole,
        locationId: locationId || undefined,
        department: department || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        profilePhoto,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        address: address || undefined,
        employmentType: employmentType || undefined,
        shift: shift || undefined,
        managerComments: managerComments || undefined,
      });

      res.status(201).json(result);
    } catch (error) {
      // Clean up uploaded file if request creation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to clean up uploaded file:', err);
        });
      }
      next(error);
    }
  }
);

// Approve a registration request (Director only)
router.post('/:id/approve', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'DIRECTOR') {
      throw new AppError('Only directors can approve registration requests', 403);
    }

    const result = await approveRequest(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Reject a registration request (Director only)
router.post('/:id/reject', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'DIRECTOR') {
      throw new AppError('Only directors can reject registration requests', 403);
    }

    const { reason } = req.body;
    const result = await rejectRequest(req.params.id, req.user.userId, reason);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
