import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { Expense, User, Location } from '../models';

export async function createExpense(userId: string, data: any) {
  try {
    logger.info('Creating expense', { userId, category: data.category, locationId: data.locationId });

    const expense = await Expense.create({
      submittedById: userId,
      locationId: data.locationId || null,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      expenseDate: new Date(data.expenseDate || new Date()),
      receipts: data.receipts || [],
      notes: data.notes || null,
      paymentMethod: data.paymentMethod || null,
      referenceNumber: data.referenceNumber || null,
      status: 'PENDING',
    });

    await expense.populate([
      {
        path: 'submittedById',
        select: 'firstName lastName email role',
      },
      'locationId',
    ]);

    logger.info('Expense created successfully', { expenseId: expense._id });
    return expense;
  } catch (error: any) {
    logger.error('Error creating expense:', error);
    throw new AppError(error.message || 'Failed to create expense', 500);
  }
}

export async function getExpenses(filters: any) {
  try {
    const { status, category, locationId, startDate, endDate, page = 1, limit = 50, userId } = filters;

    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (locationId) where.locationId = locationId;
    if (userId) where.submittedById = userId;
    
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.$gte = startDate;
      if (endDate) where.expenseDate.$lte = endDate;
    }

    const [expenses, total] = await Promise.all([
      Expense.find(where)
        .populate({
          path: 'submittedById',
          select: 'firstName lastName email role',
        })
        .populate({
          path: 'approvedById',
          select: 'firstName lastName',
        })
        .populate({
          path: 'locationId',
          select: 'name region',
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Expense.countDocuments(where),
    ]);

    return {
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    logger.error('Error fetching expenses:', error);
    throw new AppError('Failed to fetch expenses', 500);
  }
}

export async function getExpenseById(id: string) {
  const expense = await Expense.findById(id)
    .populate({
      path: 'submittedById',
      select: 'firstName lastName email role',
    })
    .populate({
      path: 'approvedById',
      select: 'firstName lastName',
    });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return expense;
}

export async function updateExpense(id: string, data: any) {
  try {
    const updateData: any = {};
    if (data.category) updateData.category = data.category;
    if (data.description) updateData.description = data.description;
    if (data.amount) updateData.amount = parseFloat(data.amount);
    if (data.location) updateData.location = data.location;
    if (data.notes) updateData.notes = data.notes;
    if (data.receipts) updateData.receipts = data.receipts;

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate({
      path: 'submittedById',
      select: 'firstName lastName email',
    });

    logger.info('Expense updated', { expenseId: id });
    return expense;
  } catch (error: any) {
    logger.error('Error updating expense:', error);
    throw new AppError('Failed to update expense', 500);
  }
}

export async function approveExpense(id: string, approverId: string, approved: boolean, notes?: string) {
  try {
    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedById: approverId,
        approvedAt: new Date(),
        notes: notes || undefined,
      },
      { new: true }
    )
      .populate('submittedById')
      .populate('approvedById');

    logger.info(`Expense ${approved ? 'approved' : 'rejected'}`, { expenseId: id, approverId });
    return expense;
  } catch (error: any) {
    logger.error('Error approving expense:', error);
    throw new AppError('Failed to approve expense', 500);
  }
}

export async function deleteExpense(id: string) {
  try {
    await Expense.findByIdAndDelete(id);
    logger.info('Expense deleted', { expenseId: id });
  } catch (error: any) {
    logger.error('Error deleting expense:', error);
    throw new AppError('Failed to delete expense', 500);
  }
}

export async function getExpenseStats() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalResult,
      pendingResult,
      approvedResult,
      rejectedResult,
      thisMonthResult,
      lastMonthResult,
    ] = await Promise.all([
      Expense.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { status: 'PENDING' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { status: 'APPROVED' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.countDocuments({ status: 'REJECTED' }),
      Expense.aggregate([
        { $match: { expenseDate: { $gte: thisMonthStart } } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            expenseDate: { $gte: lastMonthStart, $lt: thisMonthStart },
          },
        },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
    ]);

    const total = totalResult[0] || { totalAmount: 0, count: 0 };
    const pending = pendingResult[0] || { totalAmount: 0, count: 0 };
    const approved = approvedResult[0] || { totalAmount: 0, count: 0 };
    const thisMonth = thisMonthResult[0]?.totalAmount || 0;
    const lastMonth = lastMonthResult[0]?.totalAmount || 0;

    return {
      total: {
        amount: total.totalAmount,
        count: total.count,
      },
      pending: {
        amount: pending.totalAmount,
        count: pending.count,
      },
      approved: {
        amount: approved.totalAmount,
        count: approved.count,
      },
      rejected: {
        count: rejectedResult,
      },
      thisMonth,
      lastMonth,
      percentageChange: lastMonth
        ? ((thisMonth - lastMonth) / lastMonth) * 100
        : 0,
    };
  } catch (error: any) {
    logger.error('Error fetching expense stats:', error);
    throw new AppError('Failed to fetch expense statistics', 500);
  }
}

export async function getExpensesByLocation(startDate?: Date, endDate?: Date) {
  try {
    const matchStage: any = {};
    
    if (startDate || endDate) {
      matchStage.expenseDate = {};
      if (startDate) matchStage.expenseDate.$gte = startDate;
      if (endDate) matchStage.expenseDate.$lte = endDate;
    }

    const pipeline: any[] = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$locationId',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ];

    const expenses = await Expense.aggregate(pipeline);

    // Get location details
    const locationIds = expenses.map(e => e._id).filter(Boolean);
    const locations = await Location.find({ _id: { $in: locationIds } }).select('name region');

    const locationMap = new Map(locations.map(l => [l._id.toString(), l]));

    return expenses.map(e => ({
      locationId: e._id,
      locationName: e._id ? locationMap.get(e._id.toString())?.name : 'No Location',
      region: e._id ? locationMap.get(e._id.toString())?.region : null,
      amount: e.amount || 0,
      count: e.count,
    }));
  } catch (error: any) {
    logger.error('Error fetching expenses by location:', error);
    throw new AppError('Failed to fetch expenses by location', 500);
  }
}

export async function getLocationExpenseBreakdown(locationId: string, startDate?: Date, endDate?: Date) {
  try {
    const where: any = { locationId };
    
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.$gte = startDate;
      if (endDate) where.expenseDate.$lte = endDate;
    }

    // Get location details
    const location = await Location.findById(locationId).select('name region address');

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    // Get expenses by category for this location
    const byCategory = await Expense.aggregate([
      { $match: where },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get expenses by status
    const byStatus = await Expense.aggregate([
      { $match: where },
      {
        $group: {
          _id: '$status',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get total and recent expenses
    const [totalStats, recentExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: where },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.find(where)
        .populate({
          path: 'submittedById',
          select: 'firstName lastName role',
        })
        .sort({ expenseDate: -1 })
        .limit(10),
    ]);

    const total = totalStats[0] || { totalAmount: 0, count: 0 };

    return {
      location,
      summary: {
        totalAmount: total.totalAmount,
        totalCount: total.count,
      },
      byCategory: byCategory.map(c => ({
        category: c._id,
        amount: c.amount || 0,
        count: c.count,
      })),
      byStatus: byStatus.map(s => ({
        status: s._id,
        amount: s.amount || 0,
        count: s.count,
      })),
      recentExpenses,
    };
  } catch (error: any) {
    logger.error('Error fetching location expense breakdown:', error);
    throw new AppError('Failed to fetch location expense breakdown', 500);
  }
}

export async function exportExpenses(startDate?: Date, endDate?: Date, format: string = 'csv') {
  try {
    const where: any = {};
    
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.$gte = startDate;
      if (endDate) where.expenseDate.$lte = endDate;
    }

    const expenses = await Expense.find(where)
      .populate('submittedById')
      .populate('approvedById')
      .populate('locationId')
      .sort({ expenseDate: -1 });

    if (format === 'csv') {
      const headers = 'Date,Location,Category,Description,Amount,Payment Method,Reference,Status,Submitted By,Approved By\n';
      const rows = expenses.map(e => 
        `${e.expenseDate.toISOString().split('T')[0]},${(e.locationId as any)?.name || 'N/A'},${e.category},${e.description},₦${e.amount},${e.paymentMethod || 'N/A'},${e.referenceNumber || 'N/A'},${e.status},${(e.submittedById as any).firstName} ${(e.submittedById as any).lastName},${e.approvedById ? `${(e.approvedById as any).firstName} ${(e.approvedById as any).lastName}` : 'N/A'}`
      ).join('\n');
      
      return headers + rows;
    }

    return JSON.stringify(expenses, null, 2);
  } catch (error: any) {
    logger.error('Error exporting expenses:', error);
    throw new AppError('Failed to export expenses', 500);
  }
}
