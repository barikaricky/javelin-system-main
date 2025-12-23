import express from 'express';
import moneyOutService from '../services/money-out.service';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = express.Router();

// Middleware to check roles
const authorize = (...allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

// ========================================
// CREATE MONEY OUT (SECRETARY, DIRECTOR)
// ========================================
router.post(
  '/',
  authenticate,
  authorize('SECRETARY', 'DIRECTOR'),
  asyncHandler(async (req: any, res: any) => {
    const moneyOut = await moneyOutService.createMoneyOut(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Money Out request created successfully',
      data: moneyOut
    });
  })
);

// ========================================
// GET ALL MONEY OUT (ALL ROLES)
// ========================================
router.get(
  '/',
  authenticate,
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: any) => {
    const filters = {
      category: req.query.category,
      approvalStatus: req.query.approvalStatus,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      requestedById: req.query.requestedById,
      search: req.query.search
    };
    
    const moneyOuts = await moneyOutService.getAllMoneyOut(filters);
    
    res.json({
      success: true,
      data: moneyOuts
    });
  })
);

// ========================================
// GET STATISTICS
// ========================================
router.get(
  '/stats',
  authenticate,
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: any) => {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const stats = await moneyOutService.getMoneyOutStats(filters);
    
    res.json({
      success: true,
      data: stats
    });
  })
);

// ========================================
// GET DAILY RECONCILIATION (DIRECTOR)
// ========================================
router.get(
  '/reconciliation/:date',
  authenticate,
  authorize('DIRECTOR'),
  asyncHandler(async (req: any, res: any) => {
    const { date } = req.params;
    const result = await moneyOutService.getDailyReconciliation(date);
    
    res.json({
      success: true,
      data: result
    });
  })
);

// ========================================
// EXPORT TO CSV (DIRECTOR, SECRETARY)
// ========================================
router.get(
  '/export/csv',
  authenticate,
  authorize('DIRECTOR', 'SECRETARY'),
  asyncHandler(async (req: any, res: any) => {
    const filters = {
      category: req.query.category,
      approvalStatus: req.query.approvalStatus,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const csv = await moneyOutService.exportToCSV(filters);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=money-out-export.csv');
    res.send(csv);
  })
);

// ========================================
// GET SINGLE MONEY OUT (ALL ROLES)
// ========================================
router.get(
  '/:id',
  authenticate,
  authorize('SECRETARY', 'DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: any) => {
    const moneyOut = await moneyOutService.getMoneyOutById(req.params.id);
    
    res.json({
      success: true,
      data: moneyOut
    });
  })
);

// ========================================
// UPDATE MONEY OUT (SECRETARY, DIRECTOR)
// Only works if status is PENDING_APPROVAL
// ========================================
router.put(
  '/:id',
  authenticate,
  authorize('SECRETARY', 'DIRECTOR'),
  asyncHandler(async (req: any, res: any) => {
    const { reason, ...updates } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Edit reason is required'
      });
    }
    
    const moneyOut = await moneyOutService.updateMoneyOut(
      req.params.id,
      updates,
      req.user.id,
      reason
    );
    
    res.json({
      success: true,
      message: 'Money Out record updated successfully',
      data: moneyOut
    });
  })
);

// ========================================
// APPROVE MONEY OUT (DIRECTOR ONLY)
// ========================================
router.post(
  '/:id/approve',
  authenticate,
  authorize('DIRECTOR'),
  asyncHandler(async (req: any, res: any) => {
    const moneyOut = await moneyOutService.approveMoneyOut(
      req.params.id,
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Money Out request approved',
      data: moneyOut
    });
  })
);

// ========================================
// REJECT MONEY OUT (DIRECTOR ONLY)
// ========================================
router.post(
  '/:id/reject',
  authenticate,
  authorize('DIRECTOR'),
  asyncHandler(async (req: any, res: any) => {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const moneyOut = await moneyOutService.rejectMoneyOut(
      req.params.id,
      req.user.id,
      rejectionReason
    );
    
    res.json({
      success: true,
      message: 'Money Out request rejected',
      data: moneyOut
    });
  })
);

// ========================================
// MARK AS PAID (DIRECTOR ONLY)
// ========================================
router.post(
  '/:id/mark-paid',
  authenticate,
  authorize('DIRECTOR'),
  asyncHandler(async (req: any, res: any) => {
    const { paymentProof } = req.body;
    
    if (!paymentProof) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof is required'
      });
    }
    
    const moneyOut = await moneyOutService.markAsPaid(
      req.params.id,
      req.user.id,
      paymentProof
    );
    
    res.json({
      success: true,
      message: 'Money Out marked as paid',
      data: moneyOut
    });
  })
);

// ========================================
// DELETE MONEY OUT (DIRECTOR ONLY)
// ========================================
router.delete(
  '/:id',
  authenticate,
  authorize('DIRECTOR'),
  asyncHandler(async (req: any, res: any) => {
    const { deletionReason } = req.body;
    
    if (!deletionReason) {
      return res.status(400).json({
        success: false,
        message: 'Deletion reason is required'
      });
    }
    
    const moneyOut = await moneyOutService.deleteMoneyOut(
      req.params.id,
      req.user.id,
      deletionReason
    );
    
    res.json({
      success: true,
      message: 'Money Out record deleted',
      data: moneyOut
    });
  })
);

export default router;
