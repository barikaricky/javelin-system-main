import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  registerSecretary,
  getAllSecretaries,
  getSecretaryById,
  updateSecretary,
  deleteSecretary,
  getSecretaryStats,
} from '../services/secretary.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Manager can register secretaries
router.post(
  '/register',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req: any, res) => {
    logger.info('Secretary registration request', { 
      managerId: req.user.userId,
      body: req.body,
    });
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'gender', 'dateOfBirth', 'address', 'state', 'regionAssigned', 'startDate', 'salary', 'salaryCategory', 'bankName', 'bankAccountNumber'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      logger.error('Missing required fields', { missingFields });
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
      });
    }
    
    const result = await registerSecretary(req.body, req.user.userId);
    
    res.status(201).json({
      message: 'Secretary registered successfully',
      secretary: result.secretary,
      credentials: result.credentials,
    });
  })
);

// Get all secretaries
router.get(
  '/',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const secretaries = await getAllSecretaries();
    res.json(secretaries);
  })
);

// Get secretary stats
router.get(
  '/stats',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const stats = await getSecretaryStats();
    res.json(stats);
  })
);

// Get secretary by ID
router.get(
  '/:id',
  authorize('MANAGER', 'DIRECTOR', 'SECRETARY', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const secretary = await getSecretaryById(req.params.id);
    res.json(secretary);
  })
);

// Update secretary
router.put(
  '/:id',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const result = await updateSecretary(req.params.id, req.body);
    res.json({
      message: 'Secretary updated successfully',
      secretary: result.secretary,
    });
  })
);

// Delete secretary
router.delete(
  '/:id',
  authorize('MANAGER', 'DIRECTOR', 'DEVELOPER'),
  asyncHandler(async (req, res) => {
    const result = await deleteSecretary(req.params.id);
    res.json(result);
  })
);

export default router;
