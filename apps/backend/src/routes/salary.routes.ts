import { Router, Request, Response } from 'express';
import { SalaryService } from '../services/salary.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Get all salaries
 * Secretary/Manager: View-only (excluding Director salaries)
 * MD: Full visibility
 * Now fetches from User profiles with their monthly salary
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { month, year, workerRole, status, workerId } = req.query;
  const user = (req as any).user;

  // Secretary and Manager cannot see Director salaries
  const excludeDirector = user.role === 'SECRETARY' || user.role === 'MANAGER';

  const salaries = await SalaryService.getWorkerSalariesFromProfiles({
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined,
    workerRole: workerRole as any,
    status: status as any,
    workerId: workerId as string,
    excludeDirector
  });

  res.json({
    success: true,
    data: salaries
  });
}));

/**
 * Get salary statistics
 * All roles can view stats
 * Now fetches from User profiles
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const { month, year, workerRole } = req.query;
  const user = (req as any).user;

  const excludeDirector = user.role === 'SECRETARY' || user.role === 'MANAGER';

  const stats = await SalaryService.getSalaryStatsFromProfiles({
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined,
    workerRole: workerRole as any,
    excludeDirector
  });

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * Get monthly forecast
 * All roles can view forecast
 */
router.get('/forecast', asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      message: 'Month and year are required'
    });
  }

  const forecast = await SalaryService.getMonthlyForecast(Number(month), Number(year));

  res.json({
    success: true,
    data: forecast
  });
}));

/**
 * Get salary breakdown by role
 * All roles can view breakdown
 */
router.get('/breakdown', asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      message: 'Month and year are required'
    });
  }

  const breakdown = await SalaryService.getSalaryBreakdownByRole(Number(month), Number(year));

  res.json({
    success: true,
    data: breakdown
  });
}));

/**
 * Get salary by ID
 * Secretary/Manager: Cannot view Director salaries
 * MD: Full access
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const excludeDirector = user.role === 'SECRETARY' || user.role === 'MANAGER';

  const salary = await SalaryService.getSalaryById(req.params.id, excludeDirector);

  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found or access denied'
    });
  }

  res.json({
    success: true,
    data: salary
  });
}));

/**
 * Create new salary record
 * MD ONLY
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only MD can create salary records
  if (user.role !== 'DIRECTOR' || !user.isManagingDirector) {
    return res.status(403).json({
      success: false,
      message: 'Only Managing Director can create salary records'
    });
  }

  const salary = await SalaryService.createSalary({
    ...req.body,
    createdBy: user._id
  });

  res.status(201).json({
    success: true,
    message: 'Salary record created successfully',
    data: salary
  });
}));

/**
 * Update salary record
 * MD ONLY (can only edit PENDING salaries)
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only MD can update salary records
  if (user.role !== 'DIRECTOR' || !user.isManagingDirector) {
    return res.status(403).json({
      success: false,
      message: 'Only Managing Director can update salary records'
    });
  }

  const salary = await SalaryService.updateSalary(req.params.id, {
    ...req.body,
    updatedBy: user._id
  });

  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found or cannot be edited'
    });
  }

  res.json({
    success: true,
    message: 'Salary record updated successfully',
    data: salary
  });
}));

/**
 * Add deduction to salary
 * MD ONLY
 */
router.post('/:id/deduction', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only MD can add deductions
  if (user.role !== 'DIRECTOR' || !user.isManagingDirector) {
    return res.status(403).json({
      success: false,
      message: 'Only Managing Director can add deductions'
    });
  }

  const { type, amount, reason, isSystemGenerated } = req.body;

  if (!type || !amount || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Type, amount, and reason are required'
    });
  }

  const salary = await SalaryService.addDeduction({
    salaryId: req.params.id,
    type,
    amount,
    reason,
    approvedBy: user._id,
    isSystemGenerated: isSystemGenerated || false
  });

  res.json({
    success: true,
    message: 'Deduction added successfully',
    data: salary
  });
}));

/**
 * Approve salary
 * MD ONLY
 */
router.post('/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only MD can approve salaries
  if (user.role !== 'DIRECTOR' || !user.isManagingDirector) {
    return res.status(403).json({
      success: false,
      message: 'Only Managing Director can approve salaries'
    });
  }

  const salary = await SalaryService.approveSalary(req.params.id, user._id);

  res.json({
    success: true,
    message: 'Salary approved successfully',
    data: salary
  });
}));

/**
 * Mark salary as paid
 * MD ONLY
 */
router.post('/:id/mark-paid', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only MD can mark as paid
  if (user.role !== 'DIRECTOR' || !user.isManagingDirector) {
    return res.status(403).json({
      success: false,
      message: 'Only Managing Director can mark salaries as paid'
    });
  }

  const { paymentMethod, paymentReference } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required'
    });
  }

  const salary = await SalaryService.markAsPaid(
    req.params.id,
    user._id,
    paymentMethod,
    paymentReference
  );

  res.json({
    success: true,
    message: 'Salary marked as paid successfully',
    data: salary
  });
}));

/**
 * Delete salary record (soft delete)
 * MD ONLY
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only MD can delete salary records
  if (user.role !== 'DIRECTOR' || !user.isManagingDirector) {
    return res.status(403).json({
      success: false,
      message: 'Only Managing Director can delete salary records'
    });
  }

  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Delete reason is required'
    });
  }

  await SalaryService.deleteSalary(req.params.id, user._id, reason);

  res.json({
    success: true,
    message: 'Salary record deleted successfully'
  });
}));

/**
 * Get worker's salary history
 * All roles can view (with restrictions)
 */
router.get('/worker/:workerId/history', asyncHandler(async (req: Request, res: Response) => {
  const salaries = await SalaryService.getWorkerSalaryHistory(req.params.workerId);

  res.json({
    success: true,
    data: salaries
  });
}));

/**
 * Seed sample salaries (Development only)
 */
router.post('/seed', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only MD can seed
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can seed salary data'
    });
  }

  const User = require('../models/User.model').User;
  
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Find all users except directors
  const workers = await User.find({ 
    role: { $in: ['OPERATOR', 'SUPERVISOR', 'GENERAL_SUPERVISOR', 'MANAGER', 'SECRETARY'] }
  });

  if (workers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No workers found. Please create some users first.'
    });
  }

  // Define base salaries by role
  const baseSalaries: Record<string, number> = {
    'OPERATOR': 50000,
    'SUPERVISOR': 75000,
    'GENERAL_SUPERVISOR': 100000,
    'MANAGER': 150000,
    'SECRETARY': 120000
  };

  // Common allowances
  const commonAllowances = [
    { name: 'Housing', amount: 15000, description: 'Housing allowance' },
    { name: 'Transport', amount: 10000, description: 'Transport allowance' },
    { name: 'Lunch', amount: 5000, description: 'Lunch allowance' }
  ];

  const salaryPromises = workers.map(async (worker: any) => {
    const workerRole = worker.role as string;
    const baseSalary = baseSalaries[workerRole] || 50000;

    return await SalaryService.createSalary({
      workerId: worker._id.toString(),
      workerName: worker.name,
      workerRole: workerRole as any,
      month: currentMonth,
      year: currentYear,
      baseSalary: baseSalary,
      allowances: commonAllowances,
      createdBy: user._id
    });
  });

  const createdSalaries = await Promise.all(salaryPromises);

  res.json({
    success: true,
    message: `Created ${createdSalaries.length} salary records for ${currentMonth}/${currentYear}`,
    data: {
      count: createdSalaries.length,
      month: currentMonth,
      year: currentYear
    }
  });
}));

export default router;
