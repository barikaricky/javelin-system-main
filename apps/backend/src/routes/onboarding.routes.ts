import { Router } from 'express';
import { createDirector } from '../services/director-onboarding.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/onboarding/director
 * Create the first director account (Managing Director)
 * This endpoint is used by the developer to onboard the MD
 * 
 * Required fields:
 * - developerToken: The secret token from .env (DEVELOPER_ONBOARDING_TOKEN)
 * - email: Director's email
 * - firstName: Director's first name
 * - lastName: Director's last name
 * - phone: Director's phone number (optional)
 * 
 * Returns:
 * - user: Director user details
 * - employeeId: Generated unique employee ID (e.g., DIR-123456-789)
 * - temporaryPassword: Generated secure password (SAVE THIS - shown only once!)
 */
router.post('/director', asyncHandler(async (req, res) => {
  logger.info('Director onboarding attempt', { email: req.body.email });
  
  const result = await createDirector({
    developerToken: req.body.developerToken,
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
  });
  
  logger.info('Director onboarded successfully', { 
    email: req.body.email,
    employeeId: result?.user?.employeeId || 'N/A'
  });
  
  logger.info('Returning result:', result);
  
  res.status(201).json(result);
}));

export default router;
