import { Salary, ISalary, WorkerRole, DeductionType, SalaryStatus } from '../models/Salary.model';
import { AuditLog } from '../models/AuditLog.model';
import { User } from '../models/User.model';
import mongoose from 'mongoose';

interface CreateSalaryDTO {
  workerId: string;
  workerName: string;
  workerRole: WorkerRole;
  month: number;
  year: number;
  baseSalary: number;
  allowances?: Array<{ name: string; amount: number; description?: string }>;
  notes?: string;
  createdBy: string;
}

interface AddDeductionDTO {
  salaryId: string;
  type: DeductionType;
  amount: number;
  reason: string;
  approvedBy: string; // Must be MD
  isSystemGenerated?: boolean;
}

interface UpdateSalaryDTO {
  baseSalary?: number;
  allowances?: Array<{ name: string; amount: number; description?: string }>;
  notes?: string;
  updatedBy: string;
}

interface GetSalariesFilter {
  month?: number;
  year?: number;
  workerRole?: WorkerRole;
  status?: SalaryStatus;
  workerId?: string;
  excludeDirector?: boolean; // For Secretary/Manager to hide MD salary
}

export class SalaryService {
  /**
   * Create a new salary record (MD only)
   */
  static async createSalary(data: CreateSalaryDTO): Promise<ISalary> {
    const salary = new Salary({
      worker: new mongoose.Types.ObjectId(data.workerId),
      workerName: data.workerName,
      workerRole: data.workerRole,
      month: data.month,
      year: data.year,
      baseSalary: data.baseSalary,
      allowances: data.allowances || [],
      deductions: [],
      notes: data.notes,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
      status: SalaryStatus.PENDING
    });

    await salary.save();

    // Audit log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(data.createdBy),
      action: 'CREATE_SALARY',
      entityType: 'Salary',
      entityId: salary._id.toString(),
      metadata: { workerName: data.workerName, workerRole: data.workerRole, month: data.month, year: data.year }
    });

    return salary.populate('worker createdBy');
  }

  /**
   * Get all salaries with filters (role-based visibility)
   */
  static async getAllSalaries(filter: GetSalariesFilter): Promise<ISalary[]> {
    const query: any = { isDeleted: false };

    if (filter.month) query.month = filter.month;
    if (filter.year) query.year = filter.year;
    if (filter.workerRole) query.workerRole = filter.workerRole;
    if (filter.status) query.status = filter.status;
    if (filter.workerId) query.worker = new mongoose.Types.ObjectId(filter.workerId);

    // Secretary and Manager cannot see Director salaries
    if (filter.excludeDirector) {
      query.workerRole = { $ne: 'DIRECTOR' };
    }

    // Define role hierarchy for sorting
    const roleOrder = {
      'OPERATOR': 1,
      'SUPERVISOR': 2,
      'GENERAL_SUPERVISOR': 3,
      'MANAGER': 4,
      'SECRETARY': 5,
      'DIRECTOR': 6
    };

    const salaries = await Salary.find(query)
      .populate('worker', 'name email role')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 });

    // Sort by role hierarchy
    return salaries.sort((a, b) => {
      const roleA = roleOrder[a.workerRole as keyof typeof roleOrder] || 999;
      const roleB = roleOrder[b.workerRole as keyof typeof roleOrder] || 999;
      return roleA - roleB;
    });
  }

  /**
   * Get salary by ID
   */
  static async getSalaryById(salaryId: string, excludeDirector: boolean = false): Promise<ISalary | null> {
    const query: any = { _id: salaryId, isDeleted: false };

    if (excludeDirector) {
      query.workerRole = { $ne: 'DIRECTOR' };
    }

    return Salary.findOne(query)
      .populate('worker', 'name email role')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name');
  }

  /**
   * Update salary record (MD only, only PENDING status)
   */
  static async updateSalary(salaryId: string, data: UpdateSalaryDTO): Promise<ISalary | null> {
    const salary = await Salary.findOne({ 
      _id: salaryId, 
      isDeleted: false,
      status: SalaryStatus.PENDING // Can only edit pending salaries
    });

    if (!salary) {
      throw new Error('Salary record not found or cannot be edited');
    }

    if (data.baseSalary !== undefined) salary.baseSalary = data.baseSalary;
    if (data.allowances !== undefined) salary.allowances = data.allowances;
    if (data.notes !== undefined) salary.notes = data.notes;

    await salary.save();

    // Audit log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(createdBy),
      action: 'CREATE_SALARY',
      entityType: 'Salary',
      entityId: salary._id.toString(),
      metadata: { workerName: salary.workerName, month: salary.month, year: salary.year }
    });

    return salary.populate('worker createdBy approvedBy paidBy');
  }

  /**
   * Add deduction to salary (MD-approved or system-generated)
   */
  static async addDeduction(data: AddDeductionDTO): Promise<ISalary> {
    const salary = await Salary.findOne({ 
      _id: data.salaryId, 
      isDeleted: false 
    });

    if (!salary) {
      throw new Error('Salary record not found');
    }

    salary.deductions.push({
      type: data.type,
      amount: data.amount,
      reason: data.reason,
      approvedBy: new mongoose.Types.ObjectId(data.approvedBy),
      approvedAt: new Date(),
      isSystemGenerated: data.isSystemGenerated || false
    });

    await salary.save();

    // Audit log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(data.approvedBy),
      action: 'ADD_SALARY_DEDUCTION',
      entityType: 'Salary',
      entityId: salary._id.toString(),
      metadata: { workerName: salary.workerName, type: data.type, amount: data.amount }
    });

    return salary.populate('worker createdBy approvedBy paidBy');
  }

  /**
   * Approve salary (MD only)
   */
  static async approveSalary(salaryId: string, approvedBy: string): Promise<ISalary | null> {
    const salary = await Salary.findOne({ 
      _id: salaryId, 
      isDeleted: false,
      status: SalaryStatus.PENDING
    });

    if (!salary) {
      throw new Error('Salary record not found or already processed');
    }

    salary.status = SalaryStatus.APPROVED;
    salary.approvedBy = new mongoose.Types.ObjectId(approvedBy);
    salary.approvedAt = new Date();

    await salary.save();

    // Audit log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(approvedBy),
      action: 'APPROVE_SALARY',
      entityType: 'Salary',
      entityId: salary._id.toString(),
      metadata: { workerName: salary.workerName, month: salary.month, year: salary.year }
    });

    return salary.populate('worker createdBy approvedBy paidBy');
  }

  /**
   * Mark salary as paid (MD only)
   */
  static async markAsPaid(
    salaryId: string, 
    paidBy: string, 
    paymentMethod: string, 
    paymentReference?: string
  ): Promise<ISalary | null> {
    const salary = await Salary.findOne({ 
      _id: salaryId, 
      isDeleted: false,
      status: SalaryStatus.APPROVED // Must be approved first
    });

    if (!salary) {
      throw new Error('Salary record not found or not approved');
    }

    salary.status = SalaryStatus.PAID;
    salary.paidBy = new mongoose.Types.ObjectId(paidBy);
    salary.paidAt = new Date();
    salary.paymentMethod = paymentMethod;
    salary.paymentReference = paymentReference;

    await salary.save();

    // Audit log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(paidBy),
      action: 'MARK_SALARY_PAID',
      entityType: 'Salary',
      entityId: salary._id.toString(),
      metadata: { workerName: salary.workerName, month: salary.month, year: salary.year, paymentMethod }
    });

    return salary.populate('worker createdBy approvedBy paidBy');
  }

  /**
   * Delete salary record (soft delete, MD only)
   */
  static async deleteSalary(salaryId: string, deletedBy: string, reason: string): Promise<ISalary | null> {
    const salary = await Salary.findOne({ 
      _id: salaryId, 
      isDeleted: false 
    });

    if (!salary) {
      throw new Error('Salary record not found');
    }

    salary.isDeleted = true;
    salary.deletedBy = new mongoose.Types.ObjectId(deletedBy);
    salary.deletedAt = new Date();
    salary.deleteReason = reason;

    await salary.save();

    // Audit log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(deletedBy),
      action: 'DELETE_SALARY',
      entityType: 'Salary',
      entityId: salary._id.toString(),
      metadata: { workerName: salary.workerName, month: salary.month, year: salary.year, reason }
    });

    return salary;
  }

  /**
   * Get salary statistics
   */
  static async getSalaryStats(month?: number, year?: number) {
    const stats = await Salary.getStats(month, year);
    return stats[0] || {
      totalWorkers: 0,
      totalBaseSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      paidCount: 0,
      pendingCount: 0,
      approvedCount: 0
    };
  }

  /**
   * Get monthly forecast by role
   */
  static async getMonthlyForecast(month: number, year: number) {
    return Salary.getMonthlyForecast(month, year);
  }

  /**
   * Get salary breakdown by role
   */
  static async getSalaryBreakdownByRole(month: number, year: number) {
    return Salary.aggregate([
      {
        $match: {
          month,
          year,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$workerRole',
          count: { $sum: 1 },
          totalNetSalary: { $sum: '$netSalary' },
          avgNetSalary: { $avg: '$netSalary' }
        }
      },
      {
        $sort: { totalNetSalary: -1 }
      }
    ]);
  }

  /**
   * Get worker's salary history
   */
  static async getWorkerSalaryHistory(workerId: string): Promise<ISalary[]> {
    return Salary.find({ 
      worker: new mongoose.Types.ObjectId(workerId), 
      isDeleted: false 
    })
      .sort({ year: -1, month: -1 })
      .populate('createdBy approvedBy paidBy', 'name');
  }

  /**
   * Get worker salaries from User profiles with deductions for a specific month
   */
  static async getWorkerSalariesFromProfiles(filter: GetSalariesFilter) {
    const { month, year, workerRole, status, excludeDirector } = filter;
    
    // Build user query - don't filter by ACTIVE status, include all workers
    const userQuery: any = {};

    // Handle role filtering
    if (workerRole) {
      // If a specific role is selected, filter by that role
      userQuery.role = workerRole;
    } else {
      // Otherwise, show all worker roles
      userQuery.role = { $in: ['OPERATOR', 'SUPERVISOR', 'GENERAL_SUPERVISOR', 'MANAGER', 'SECRETARY'] };
    }

    // Exclude directors if needed (for Secretary/Manager)
    if (excludeDirector && !workerRole) {
      // Only apply if no specific role is selected
      userQuery.role = { $in: ['OPERATOR', 'SUPERVISOR', 'GENERAL_SUPERVISOR', 'MANAGER', 'SECRETARY'] };
    } else if (excludeDirector && workerRole === 'DIRECTOR') {
      // If they somehow try to select DIRECTOR when excludeDirector is true, return empty
      userQuery.role = 'NON_EXISTENT_ROLE'; // This will return no results
    }

    // Get all workers
    const workers = await User.find(userQuery)
      .select('_id firstName lastName email accountNumber accountName bankName monthlySalary role status createdAt')
      .sort({ role: 1, lastName: 1 });

    // Get deductions for the specified month/year if provided
    const deductionsMap = new Map();
    if (month && year) {
      const deductions = await Salary.find({
        month,
        year,
        isDeleted: false
      }).select('worker deductions totalDeductions status');

      deductions.forEach(salary => {
        deductionsMap.set(salary.worker.toString(), {
          deductions: salary.deductions,
          totalDeductions: salary.totalDeductions,
          salaryStatus: salary.status
        });
      });
    }

    // Define role hierarchy for sorting
    const roleOrder: Record<string, number> = {
      'OPERATOR': 1,
      'SUPERVISOR': 2,
      'GENERAL_SUPERVISOR': 3,
      'MANAGER': 4,
      'SECRETARY': 5,
      'DIRECTOR': 6
    };

    // Map workers to salary format
    const workerSalaries = workers.map(worker => {
      const workerId = worker._id.toString();
      const deductionData = deductionsMap.get(workerId) || { 
        deductions: [], 
        totalDeductions: 0,
        salaryStatus: 'PENDING'
      };
      const monthlySalary = worker.monthlySalary || 0;
      const netSalary = monthlySalary - deductionData.totalDeductions;

      return {
        _id: workerId,
        worker: {
          _id: worker._id,
          name: `${worker.firstName} ${worker.lastName}`,
          email: worker.email,
          role: worker.role
        },
        workerName: `${worker.firstName} ${worker.lastName}`,
        workerRole: worker.role,
        accountNumber: worker.accountNumber || 'Not provided',
        accountName: worker.accountName || 'Not provided',
        bankName: worker.bankName || 'Not provided',
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
        baseSalary: monthlySalary,
        monthlySalary: monthlySalary,
        totalAllowances: 0,
        totalDeductions: deductionData.totalDeductions,
        netSalary: netSalary,
        deductions: deductionData.deductions,
        allowances: [],
        status: deductionData.salaryStatus || (deductionData.totalDeductions > 0 ? 'PROCESSED' : 'PENDING'),
        createdAt: worker.createdAt
      };
    });

    // Filter by status if provided
    let filteredSalaries = workerSalaries;
    if (status) {
      filteredSalaries = workerSalaries.filter(s => s.status === status);
    }

    // Sort by role hierarchy
    return filteredSalaries.sort((a, b) => {
      const roleA = roleOrder[a.workerRole] || 999;
      const roleB = roleOrder[b.workerRole] || 999;
      return roleA - roleB;
    });
  }

  /**
   * Get salary statistics from user profiles
   */
  static async getSalaryStatsFromProfiles(filter: GetSalariesFilter) {
    const workerSalaries = await this.getWorkerSalariesFromProfiles(filter);

    return {
      totalWorkers: workerSalaries.length,
      totalBaseSalary: workerSalaries.reduce((sum, w) => sum + w.baseSalary, 0),
      totalAllowances: 0,
      totalDeductions: workerSalaries.reduce((sum, w) => sum + w.totalDeductions, 0),
      totalNetSalary: workerSalaries.reduce((sum, w) => sum + w.netSalary, 0),
      paidCount: 0,
      pendingCount: workerSalaries.length,
      approvedCount: 0
    };
  }
}
