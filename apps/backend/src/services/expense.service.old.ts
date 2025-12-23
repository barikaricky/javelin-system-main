import { prisma } from '../utils/database';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

export async function createExpense(userId: string, data: any) {
  try {
    logger.info('Creating expense', { userId, category: data.category, locationId: data.locationId });

    const expense = await prisma.expense.create({
      data: {
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
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        location: true,
      },
    });

    logger.info('Expense created successfully', { expenseId: expense.id });
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
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
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
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return expense;
}

export async function updateExpense(id: string, data: any) {
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(data.category && { category: data.category }),
        ...(data.description && { description: data.description }),
        ...(data.amount && { amount: parseFloat(data.amount) }),
        ...(data.location && { location: data.location }),
        ...(data.notes && { notes: data.notes }),
        ...(data.receipts && { receipts: data.receipts }),
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
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
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedById: approverId,
        approvedAt: new Date(),
        notes: notes || undefined,
      },
      include: {
        submittedBy: true,
        approvedBy: true,
      },
    });

    logger.info(`Expense ${approved ? 'approved' : 'rejected'}`, { expenseId: id, approverId });
    return expense;
  } catch (error: any) {
    logger.error('Error approving expense:', error);
    throw new AppError('Failed to approve expense', 500);
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({
      where: { id },
    });
    logger.info('Expense deleted', { expenseId: id });
  } catch (error: any) {
    logger.error('Error deleting expense:', error);
    throw new AppError('Failed to delete expense', 500);
  }
}

export async function getExpenseStats() {
  try {
    const [total, pending, approved, rejected, thisMonth, lastMonth] = await Promise.all([
      prisma.expense.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { status: 'REJECTED' },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      total: {
        amount: total._sum.amount || 0,
        count: total._count,
      },
      pending: {
        amount: pending._sum.amount || 0,
        count: pending._count,
      },
      approved: {
        amount: approved._sum.amount || 0,
        count: approved._count,
      },
      rejected: {
        count: rejected._count,
      },
      thisMonth: thisMonth._sum.amount || 0,
      lastMonth: lastMonth._sum.amount || 0,
      percentageChange: lastMonth._sum.amount
        ? (((thisMonth._sum.amount || 0) - (lastMonth._sum.amount || 0)) / (lastMonth._sum.amount || 1)) * 100
        : 0,
    };
  } catch (error: any) {
    logger.error('Error fetching expense stats:', error);
    throw new AppError('Failed to fetch expense statistics', 500);
  }
}

export async function getExpensesByLocation(startDate?: Date, endDate?: Date) {
  try {
    const where: any = {};
    
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const expenses = await prisma.expense.groupBy({
      by: ['locationId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get location details
    const locationIds = expenses.map(e => e.locationId).filter(Boolean) as string[];
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true, region: true },
    });

    const locationMap = new Map(locations.map(l => [l.id, l]));

    return expenses.map(e => ({
      locationId: e.locationId,
      locationName: e.locationId ? locationMap.get(e.locationId)?.name : 'No Location',
      region: e.locationId ? locationMap.get(e.locationId)?.region : null,
      amount: e._sum.amount || 0,
      count: e._count,
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
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    // Get location details
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, name: true, region: true, address: true },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    // Get expenses by category for this location
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get expenses by status
    const byStatus = await prisma.expense.groupBy({
      by: ['status'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get total and recent expenses
    const [totalStats, recentExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.findMany({
        where,
        include: {
          submittedBy: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { expenseDate: 'desc' },
        take: 10,
      }),
    ]);

    return {
      location,
      summary: {
        totalAmount: totalStats._sum.amount || 0,
        totalCount: totalStats._count,
      },
      byCategory: byCategory.map(c => ({
        category: c.category,
        amount: c._sum.amount || 0,
        count: c._count,
      })),
      byStatus: byStatus.map(s => ({
        status: s.status,
        amount: s._sum.amount || 0,
        count: s._count,
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
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        submittedBy: true,
        approvedBy: true,
        location: true,
      },
      orderBy: { expenseDate: 'desc' },
    });

    if (format === 'csv') {
      const headers = 'Date,Location,Category,Description,Amount,Payment Method,Reference,Status,Submitted By,Approved By\n';
      const rows = expenses.map(e => 
        `${e.expenseDate.toISOString().split('T')[0]},${e.location?.name || 'N/A'},${e.category},${e.description},₦${e.amount},${e.paymentMethod || 'N/A'},${e.referenceNumber || 'N/A'},${e.status},${e.submittedBy.firstName} ${e.submittedBy.lastName},${e.approvedBy ? `${e.approvedBy.firstName} ${e.approvedBy.lastName}` : 'N/A'}`
      ).join('\n');
      
      return headers + rows;
    }

    return JSON.stringify(expenses, null, 2);
  } catch (error: any) {
    logger.error('Error exporting expenses:', error);
    throw new AppError('Failed to export expenses', 500);
  }
}
