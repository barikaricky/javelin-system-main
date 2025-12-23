import { Router, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as moneyInService from '../services/money-in.service';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/money-in
 * Create a new Money In record
 * Access: Secretary, Director
 */
router.post(
  '/',
  authorize('SECRETARY', 'DIRECTOR'),
  asyncHandler(async (req: any, res: Response) => {
    const transaction = await moneyInService.createMoneyIn(
      req.body,
      req.user.userId
    );
    
    res.status(201).json({
      success: true,
      message: 'Money In record created successfully',
      data: transaction
    });
  })
);

/**
 * GET /api/money-in
 * Get all Money In records with filters
 * Access: Secretary, Director, Manager
 */
router.get(
  '/',
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = '1',
      limit = '50',
      startDate,
      endDate,
      paymentMethod,
      source,
      clientId,
      minAmount,
      maxAmount,
      search,
      includeDeleted = 'false'
    } = req.query;

    const filters = {
      startDate,
      endDate,
      paymentMethod,
      source,
      clientId,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      search
    };

    const result = await moneyInService.getMoneyInRecords(
      filters,
      parseInt(page),
      parseInt(limit),
      req.user.role,
      includeDeleted === 'true'
    );

    res.json({
      success: true,
      data: result.records,
      pagination: result.pagination,
      summary: result.summary
    });
  })
);

/**
 * GET /api/money-in/stats
 * Get Money In statistics
 * Access: Secretary, Director, Manager
 */
router.get(
  '/stats',
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: Response) => {
    const { startDate, endDate } = req.query;
    
    const stats = await moneyInService.getMoneyInStats(startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/money-in/daily-reconciliation/:date
 * Get daily reconciliation report for specified date
 * Access: Secretary, Director, Manager
 */
router.get(
  '/daily-reconciliation/:date',
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: Response) => {
    const { date } = req.params;
    
    const reconciliation = await moneyInService.getDailyReconciliation(date);

    res.json({
      success: true,
      data: reconciliation
    });
  })
);

/**
 * GET /api/money-in/:id
 * Get a single Money In record by ID
 * Access: Secretary, Director, Manager
 */
router.get(
  '/:id',
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    
    const transaction = await moneyInService.getMoneyInRecords(
      {},
      1,
      1,
      req.user.role,
      false
    );

    // Filter by ID (simpler than creating new service method)
    const record = transaction.records.find((r: any) => r._id.toString() === id);
    
    if (!record) {
      res.status(404).json({
        success: false,
        message: 'Money In record not found'
      });
      return;
    }

    res.json({
      success: true,
      data: record
    });
  })
);

/**
 * GET /api/money-in/:id/history
 * Get edit history for a Money In record
 * Access: Secretary, Director, Manager
 */
router.get(
  '/:id/history',
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    
    const history = await moneyInService.getMoneyInHistory(id);

    res.json({
      success: true,
      data: history
    });
  })
);

/**
 * PUT /api/money-in/:id
 * Edit an existing Money In record
 * Access: Secretary, Director
 * Required: reason field in request body
 */
router.put(
  '/:id',
  authorize('SECRETARY', 'DIRECTOR'),
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    
    const transaction = await moneyInService.editMoneyIn(
      id,
      req.body,
      req.user.userId,
      req.user.role
    );

    res.json({
      success: true,
      message: 'Money In record updated successfully',
      data: transaction
    });
  })
);

/**
 * DELETE /api/money-in/:id
 * Soft delete a Money In record (archive)
 * Access: Director only
 * Required: reason field in request body
 */
router.delete(
  '/:id',
  authorize('DIRECTOR'),
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        message: 'Reason is required for deleting Money In records'
      });
      return;
    }

    const result = await moneyInService.softDeleteMoneyIn(
      id,
      req.user.userId,
      req.user.role,
      reason
    );

    res.json({
      success: true,
      message: result.message,
      data: result.archivedRecord
    });
  })
);

export default router;
