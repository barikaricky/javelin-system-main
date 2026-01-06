import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as adminService from '../services/admin.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/admin-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authenticate);

/**
 * @route   POST /api/admins/register
 * @desc    Register a new admin (Director only)
 * @access  Private (Director)
 */
router.post(
  '/register',
  requireRole(['DIRECTOR']),
  upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Convert absolute paths to relative paths for serving
    const governmentIdUrl = files?.governmentId?.[0]?.path 
      ? `/uploads/admin-documents/${path.basename(files.governmentId[0].path)}`
      : undefined;
    const passportPhotoUrl = files?.passportPhoto?.[0]?.path
      ? `/uploads/admin-documents/${path.basename(files.passportPhoto[0].path)}`
      : undefined;

    const { admin, user } = await adminService.registerAdmin({
      ...req.body,
      employmentStartDate: new Date(req.body.employmentStartDate),
      accessExpiryDate: req.body.accessExpiryDate
        ? new Date(req.body.accessExpiryDate)
        : undefined,
      governmentIdUrl,
      passportPhotoUrl,
      createdById: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully. They must change password on first login.',
      admin,
      staffId: admin.staffId,
    });
  })
);

/**
 * @route   GET /api/admins
 * @desc    Get all admins with filters
 * @access  Private (Director)
 */
router.get(
  '/',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      isActive,
      isSuspended,
      officeLocationId,
      department,
      adminRoleLevel,
      search,
      page,
      limit,
    } = req.query;

    const result = await adminService.getAllAdmins({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSuspended: isSuspended === 'true' ? true : isSuspended === 'false' ? false : undefined,
      officeLocationId: officeLocationId as string,
      department: department as string,
      adminRoleLevel: adminRoleLevel as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * @route   GET /api/admins/stats
 * @desc    Get admin statistics
 * @access  Private (Director)
 */
router.get(
  '/stats',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await adminService.getAdminStats();
    res.json({
      success: true,
      stats,
    });
  })
);

/**
 * @route   GET /api/admins/my-profile
 * @desc    Get current admin's own profile
 * @access  Private (Admin)
 */
router.get(
  '/my-profile',
  requireRole(['ADMIN']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getAdminByUserId(req.user!.userId);
    res.json({
      success: true,
      admin,
    });
  })
);

/**
 * @route   GET /api/admins/dashboard-stats
 * @desc    Get dashboard statistics for admin
 * @access  Private (Admin)
 */
router.get(
  '/dashboard-stats',
  requireRole(['ADMIN']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  })
);

/**
 * @route   GET /api/admins/:id
 * @desc    Get admin by ID
 * @access  Private (Manager, Director)
 */
router.get(
  '/:id',
  requireRole(['MANAGER', 'DIRECTOR', 'ADMIN']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getAdminById(req.params.id);
    res.json({
      success: true,
      admin,
    });
  })
);

/**
 * @route   GET /api/admins/user/:userId
 * @desc    Get admin by user ID
 * @access  Private
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getAdminByUserId(req.params.userId);
    res.json({
      success: true,
      admin,
    });
  })
);

/**
 * @route   PUT /api/admins/:id
 * @desc    Update admin
 * @access  Private (Director)
 */
router.put(
  '/:id',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const admin = await adminService.updateAdmin(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Admin updated successfully',
      admin,
    });
  })
);

/**
 * @route   POST /api/admins/:id/suspend
 * @desc    Suspend admin (Director only)
 * @access  Private (Director)
 */
router.post(
  '/:id/suspend',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required',
      });
    }

    const admin = await adminService.suspendAdmin(
      req.params.id,
      reason,
      req.user!.userId
    );

    res.json({
      success: true,
      message: 'Admin suspended successfully',
      admin,
    });
  })
);

/**
 * @route   POST /api/admins/:id/reactivate
 * @desc    Reactivate admin
 * @access  Private (Director)
 */
router.post(
  '/:id/reactivate',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const admin = await adminService.reactivateAdmin(req.params.id);
    res.json({
      success: true,
      message: 'Admin reactivated successfully',
      admin,
    });
  })
);

export default router;
