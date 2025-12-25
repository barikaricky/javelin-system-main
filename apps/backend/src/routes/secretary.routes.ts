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
    
    // Validate required fields - check for undefined/null, not empty strings or 0
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'gender', 'dateOfBirth', 'address', 'state', 'regionAssigned', 'startDate', 'bankName', 'bankAccountNumber'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    // For salary and salaryCategory, check specifically
    if (req.body.salary === undefined || req.body.salary === null) {
      missingFields.push('salary');
    }
    if (!req.body.salaryCategory || req.body.salaryCategory === '') {
      missingFields.push('salaryCategory');
    }
    
    if (missingFields.length > 0) {
      logger.error('Missing required fields', { missingFields, receivedData: req.body });
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
      });
    }
    
    logger.info('All required fields present, proceeding with registration...');
    
    try {
      const result = await registerSecretary(req.body, req.user.userId);
      
      logger.info('Secretary service returned successfully', {
        secretaryId: result.secretary._id,
        credentials: result.credentials,
      });
      
      res.status(201).json({
        message: 'Secretary registered successfully',
        secretary: result.secretary,
        credentials: result.credentials,
      });
      
      logger.info('Response sent to client successfully');
    } catch (error: any) {
      logger.error('Error in secretary registration route:', {
        error: error.message,
        stack: error.stack,
      });
      throw error; // Let asyncHandler deal with it
    }
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
