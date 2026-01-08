import { Router, Request, Response } from 'express';
import { SalaryService } from '../services/salary.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { Operator, Supervisor, Manager, User } from '../models';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Get all workers with their salary information
 * Fetches from Operator, Supervisor, Manager models
 */
router.get('/workers', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Fetch all operators with salary info
    const operators = await Operator.find({ approvalStatus: 'APPROVED' })
      .populate('userId', 'firstName lastName email phone passportPhoto')
      .populate('supervisorId', 'employeeId')
      .populate('locationId', 'locationName')
      .select('employeeId userId salary approvalStatus supervisorId locationId createdAt')
      .lean();

    // Fetch all supervisors with salary info
    const supervisors = await Supervisor.find({ approvalStatus: 'APPROVED' })
      .populate('userId', 'firstName lastName email phone passportPhoto')
      .populate('locationId', 'locationName')
      .select('employeeId userId salary approvalStatus locationId supervisorType createdAt')
      .lean();

    // Fetch all managers with salary info
    const managers = await Manager.find({ approvalStatus: 'APPROVED' })
      .populate('userId', 'firstName lastName email phone passportPhoto')
      .select('employeeId userId salary approvalStatus createdAt')
      .lean();

    // Format and combine all workers
    const allWorkers = [
      ...operators.map((op: any) => ({
        _id: op._id,
        employeeId: op.employeeId,
        name: op.userId ? `${op.userId.firstName} ${op.userId.lastName}` : 'Unknown',
        email: op.userId?.email || 'N/A',
        phone: op.userId?.phone || 'N/A',
        photo: op.userId?.passportPhoto,
        role: 'OPERATOR',
        salary: op.salary || 0,
        location: op.locationId?.locationName || 'N/A',
        supervisor: op.supervisorId?.employeeId || 'N/A',
        approvalStatus: op.approvalStatus,
        createdAt: op.createdAt,
      })),
      ...supervisors.map((sup: any) => ({
        _id: sup._id,
        employeeId: sup.employeeId,
        name: sup.userId ? `${sup.userId.firstName} ${sup.userId.lastName}` : 'Unknown',
        email: sup.userId?.email || 'N/A',
        phone: sup.userId?.phone || 'N/A',
        photo: sup.userId?.passportPhoto,
        role: sup.supervisorType || 'SUPERVISOR', // Use supervisorType field
        salary: sup.salary || 0,
        location: sup.locationId?.locationName || 'N/A',
        supervisor: 'N/A',
        approvalStatus: sup.approvalStatus,
        createdAt: sup.createdAt,
      })),
      ...managers.map((mgr: any) => ({
        _id: mgr._id,
        employeeId: mgr.employeeId,
        name: mgr.userId ? `${mgr.userId.firstName} ${mgr.userId.lastName}` : 'Unknown',
        email: mgr.userId?.email || 'N/A',
        phone: mgr.userId?.phone || 'N/A',
        photo: mgr.userId?.passportPhoto,
        role: 'MANAGER',
        salary: mgr.salary || 0,
        location: 'Head Office',
        supervisor: 'Director',
        approvalStatus: mgr.approvalStatus,
        createdAt: mgr.createdAt,
      })),
    ];

    // Sort by role hierarchy and creation date
    const roleOrder = { 
      OPERATOR: 1, 
      SUPERVISOR: 2, 
      FIELD_SUPERVISOR: 2,
      SHIFT_SUPERVISOR: 2,
      AREA_SUPERVISOR: 2,
      GENERAL_SUPERVISOR: 3, 
      MANAGER: 4 
    };
    allWorkers.sort((a, b) => {
      const roleCompare = (roleOrder[a.role as keyof typeof roleOrder] || 999) - (roleOrder[b.role as keyof typeof roleOrder] || 999);
      if (roleCompare !== 0) return roleCompare;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: allWorkers,
      total: allWorkers.length,
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workers',
    });
  }
}));

/**
 * Get all salaries
 * Secretary/Manager: View-only (excluding Director salaries)
 * MD: Full visibility
 * Fetches from actual Salary collection
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { month, year, workerRole, status, workerId } = req.query;
  const user = (req as any).user;

  // Secretary and Manager cannot see Director salaries
  const excludeDirector = user.role === 'SECRETARY' || user.role === 'MANAGER';

  const salaries = await SalaryService.getAllSalaries({
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined,
    workerRole: workerRole as any,
    status: status as any,
    workerId: workerId as string,
    excludeDirector
  });

  console.log(`📊 Returning ${salaries.length} REAL salaries from Salary collection`);
  if (salaries.length > 0) {
    console.log('First 3 salary IDs:', salaries.slice(0, 3).map((s: any) => ({ id: s._id, name: s.workerName, status: s.status })));
  }

  res.json({
    success: true,
    data: salaries
  });
}));

/**
 * Get salary statistics
 * All roles can view stats
 * Fetches from actual Salary collection
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const { month, year, workerRole } = req.query;
  const user = (req as any).user;

  const excludeDirector = user.role === 'SECRETARY' || user.role === 'MANAGER';

  const stats = await SalaryService.getSalaryStats(
    month ? Number(month) : undefined,
    year ? Number(year) : undefined
  );

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
 * DIRECTOR ONLY
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can create salary records
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can create salary records'
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
 * DIRECTOR ONLY (can only edit PENDING salaries)
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can update salary records
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can update salary records'
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
 * DIRECTOR ONLY
 */
router.post('/:id/deduction', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can add deductions
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can add deductions'
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
 * Add allowance to salary
 * DIRECTOR ONLY
 */
router.post('/:id/allowance', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can add allowances
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can add allowances'
    });
  }

  const { name, amount, description } = req.body;

  if (!name || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Name and amount are required'
    });
  }

  const salary = await SalaryService.addAllowance({
    salaryId: req.params.id,
    name,
    amount,
    description: description || ''
  });

  res.json({
    success: true,
    message: 'Allowance added successfully',
    data: salary
  });
}));

/**
 * Approve salary
 * DIRECTOR ONLY
 */
router.post('/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can approve salaries
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can approve salaries'
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
 * DIRECTOR ONLY
 */
router.post('/:id/mark-paid', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can mark as paid
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can mark salaries as paid'
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
 * DIRECTOR ONLY
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can delete salary records
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can delete salary records'
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
 * Approve monthly salaries for all workers
 * DIRECTOR ONLY
 * Creates salary records for the specified month/year
 */
router.post('/approve-monthly', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Only Directors can approve monthly salaries
  if (user.role !== 'DIRECTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only Directors can approve monthly salaries'
    });
  }

  const { month, year, role } = req.body;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      message: 'Month and year are required'
    });
  }

  try {
    // Fetch workers based on role filter
    const filter: any = { approvalStatus: 'APPROVED' };
    
    let workers: any[] = [];
    
    // Helper to check if a supervisor type matches the filter
    const matchesSupervisorRole = (supervisorType: string, filterRole: string) => {
      if (!filterRole) return true; // No filter, include all
      // Direct match
      if (supervisorType === filterRole) return true;
      // If filter is "SUPERVISOR", include all supervisor types except GENERAL_SUPERVISOR
      if (filterRole === 'SUPERVISOR') {
        return supervisorType !== 'GENERAL_SUPERVISOR';
      }
      return false;
    };
    
    if (!role || role === 'OPERATOR') {
      const operators = await Operator.find(filter)
        .populate('userId', 'firstName lastName email')
        .select('employeeId userId salary')
        .lean();
      workers.push(...operators.map((op: any) => ({
        _id: op._id,
        employeeId: op.employeeId,
        name: `${op.userId.firstName} ${op.userId.lastName}`,
        email: op.userId.email,
        role: 'OPERATOR',
        salary: op.salary || 0,
      })));
    }
    
    // Fetch supervisors - need to check supervisorType field
    if (!role || role === 'SUPERVISOR' || role === 'GENERAL_SUPERVISOR' || role === 'FIELD_SUPERVISOR' || role === 'SHIFT_SUPERVISOR' || role === 'AREA_SUPERVISOR') {
      const supervisors = await Supervisor.find(filter)
        .populate('userId', 'firstName lastName email')
        .select('employeeId userId salary supervisorType')
        .lean();
      
      workers.push(...supervisors
        .filter((sup: any) => matchesSupervisorRole(sup.supervisorType, role))
        .map((sup: any) => ({
          _id: sup._id,
          employeeId: sup.employeeId,
          name: `${sup.userId.firstName} ${sup.userId.lastName}`,
          email: sup.userId.email,
          role: sup.supervisorType || 'SUPERVISOR',
          salary: sup.salary || 0,
        }))
      );
    }
    
    if (!role || role === 'MANAGER') {
      const managers = await Manager.find(filter)
        .populate('userId', 'firstName lastName email')
        .select('employeeId userId salary')
        .lean();
      workers.push(...managers.map((mgr: any) => ({
        _id: mgr._id,
        employeeId: mgr.employeeId,
        name: `${mgr.userId.firstName} ${mgr.userId.lastName}`,
        email: mgr.userId.email,
        role: 'MANAGER',
        salary: mgr.salary || 0,
      })));
    }

    if (workers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No approved workers found for the selected criteria'
      });
    }

    // Check for existing salary records and create only for workers who don't have records yet
    const results = {
      created: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    };

    for (const worker of workers) {
      try {
        // Check if salary record already exists
        const existingSalary = await SalaryService.getSalaryByWorkerAndPeriod(
          worker._id.toString(),
          Number(month),
          Number(year)
        );

        if (existingSalary) {
          results.skipped.push({
            workerId: worker._id,
            workerName: worker.name,
            reason: 'Salary record already exists'
          });
          continue;
        }

        // Create new salary record with APPROVED status
        const salary = await SalaryService.createSalary({
          workerId: worker._id.toString(),
          workerName: worker.name,
          workerRole: worker.role as any,
          month: Number(month),
          year: Number(year),
          baseSalary: worker.salary,
          allowances: [],
          createdBy: user._id,
          status: 'APPROVED' as any,
          approvedBy: user._id
        });

        results.created.push({
          workerId: worker._id,
          workerName: worker.name,
          salaryId: salary._id
        });
      } catch (err: any) {
        results.errors.push({
          workerId: worker._id,
          workerName: worker.name,
          error: err.message
        });
      }
    }

    const message = [
      results.created.length > 0 ? `Created ${results.created.length} salary records` : null,
      results.skipped.length > 0 ? `Skipped ${results.skipped.length} (already exist)` : null,
      results.errors.length > 0 ? `Failed ${results.errors.length}` : null
    ].filter(Boolean).join(', ');

    res.json({
      success: true,
      message: message || 'No salary records created',
      data: {
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        month: Number(month),
        year: Number(year),
        role: role || 'All Roles',
        details: results
      }
    });
  } catch (error: any) {
    console.error('Error approving monthly salaries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve monthly salaries'
    });
  }
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
