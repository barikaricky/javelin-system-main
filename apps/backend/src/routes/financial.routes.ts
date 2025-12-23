import express from 'express';
import { getFinancialOverview, getDailyLogs, getMonthlyLogs } from '../controllers/financial.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/financial/overview - Get financial overview summary
router.get('/overview', getFinancialOverview);

// GET /api/financial/daily-logs - Get daily financial logs
router.get('/daily-logs', getDailyLogs);

// GET /api/financial/monthly-logs - Get monthly financial logs
router.get('/monthly-logs', getMonthlyLogs);

export default router;
