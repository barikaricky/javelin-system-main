import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as bitExpenseService from '../services/bit-expense.service';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/bit-expenses
 * Get all expenses with filters
 */
router.get(
  '/',
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const filters = {
      bitId: req.query.bitId as string,
      category: req.query.category as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      paymentMethod: req.query.paymentMethod as string,
      isUnallocated: req.query.isUnallocated === 'true' ? true : req.query.isUnallocated === 'false' ? false : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      sortBy: (req.query.sortBy as 'date' | 'amount' | 'category') || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await bitExpenseService.getBitExpenses(filters);
    res.json(result);
  })
);

/**
 * GET /api/bit-expenses/summary
 * Get BITs with expense summaries
 */
router.get(
  '/summary',
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
    const result = await bitExpenseService.getBitsWithExpenseSummary(period);
    res.json(result);
  })
);

/**
 * GET /api/bit-expenses/statistics
 * Get expense statistics
 */
router.get(
  '/statistics',
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const filters = {
      bitId: req.query.bitId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await bitExpenseService.getExpenseStatistics(filters);
    res.json(result);
  })
);

/**
 * GET /api/bit-expenses/bit/:bitId/summary
 * Get expense summary for a specific BIT
 */
router.get(
  '/bit/:bitId/summary',
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const { bitId } = req.params;
    const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
    const result = await bitExpenseService.getBitExpenseSummary(bitId, period);
    res.json(result);
  })
);

/**
 * GET /api/bit-expenses/:id
 * Get expense by ID
 */
router.get(
  '/:id',
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const expense = await bitExpenseService.getBitExpenseById(req.params.id);
    res.json(expense);
  })
);

/**
 * POST /api/bit-expenses
 * Create new expense (Director & Secretary only)
 */
router.post(
  '/',
  authorize('DIRECTOR', 'SECRETARY'),
  asyncHandler(async (req, res) => {
    logger.info('Creating expense - Request body:', req.body);
    
    const data = {
      bitId: req.body.bitId && req.body.bitId !== '' ? req.body.bitId : undefined,
      locationId: req.body.locationId && req.body.locationId !== '' ? req.body.locationId : undefined,
      category: req.body.category,
      description: req.body.description,
      amount: parseFloat(req.body.amount),
      dateIncurred: req.body.dateIncurred ? new Date(req.body.dateIncurred) : new Date(),
      paymentMethod: req.body.paymentMethod || 'CASH',
      userId: req.user.userId,
      receiptUrl: req.body.receiptUrl,
      notes: req.body.notes,
    };
    
    logger.info('Creating expense - Processed data:', data);

    const expense = await bitExpenseService.createBitExpense(data);
    logger.info('BitExpense created', { expenseId: expense.id, userId: req.user.userId });
    res.status(201).json(expense);
  })
);

/**
 * PUT /api/bit-expenses/:id
 * Update expense (Director & Secretary only)
 */
router.put(
  '/:id',
  authorize('DIRECTOR', 'SECRETARY'),
  asyncHandler(async (req, res) => {
    const data = {
      bitId: req.body.bitId,
      locationId: req.body.locationId,
      category: req.body.category,
      description: req.body.description,
      amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : undefined,
      dateIncurred: req.body.dateIncurred ? new Date(req.body.dateIncurred) : undefined,
      paymentMethod: req.body.paymentMethod,
      receiptUrl: req.body.receiptUrl,
      notes: req.body.notes,
    };

    const expense = await bitExpenseService.updateBitExpense(req.params.id, data, req.user.userId);
    logger.info('BitExpense updated', { expenseId: expense.id, userId: req.user.userId });
    res.json(expense);
  })
);

/**
 * DELETE /api/bit-expenses/bit/:bitId/all
 * Delete all expenses for a BIT (Director only)
 * NOTE: This must come BEFORE the /:id route
 */
router.delete(
  '/bit/:bitId/all',
  authorize('DIRECTOR'),
  asyncHandler(async (req, res) => {
    const result = await bitExpenseService.deleteAllBitExpenses(req.params.bitId, req.user.userId);
    logger.info('All BIT expenses deleted', { bitId: req.params.bitId, count: result.count, userId: req.user.userId });
    res.json({ message: `${result.count} expenses deleted successfully`, count: result.count });
  })
);

/**
 * DELETE /api/bit-expenses/:id
 * Delete expense (Director only)
 */
router.delete(
  '/:id',
  authorize('DIRECTOR'),
  asyncHandler(async (req, res) => {
    const result = await bitExpenseService.deleteBitExpense(req.params.id, req.user.userId);
    logger.info('BitExpense deleted', { expenseId: req.params.id, userId: req.user.userId });
    res.json(result);
  })
);

export default router;
