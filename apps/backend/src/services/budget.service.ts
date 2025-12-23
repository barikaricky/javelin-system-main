import { Budget } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

export async function createBudget(data: any, createdById: string) {
  try {
    const budget = await Budget.create({
      budgetName: data.budgetName,
      budgetPeriod: data.budgetPeriod,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      totalAmount: data.totalAmount,
      categories: data.categories || [],
      status: 'DRAFT',
      createdById,
      notes: data.notes,
    });

    logger.info('Budget created', { budgetId: budget._id });
    return budget;
  } catch (error) {
    logger.error('Create budget error:', error);
    throw error;
  }
}

export async function getAllBudgets(filters?: any, page = 1, limit = 50) {
  const where: any = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.budgetPeriod) where.budgetPeriod = filters.budgetPeriod;

  const [budgets, total] = await Promise.all([
    Budget.find(where)
      .populate({ path: 'createdById', select: 'firstName lastName' })
      .populate({ path: 'approvedById', select: 'firstName lastName' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Budget.countDocuments(where),
  ]);

  return {
    budgets,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getBudgetById(id: string) {
  const budget = await Budget.findById(id)
    .populate({ path: 'createdById', select: 'firstName lastName email' })
    .populate({ path: 'approvedById', select: 'firstName lastName email' });

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  return budget;
}

export async function updateBudget(id: string, data: any) {
  const budget = await Budget.findByIdAndUpdate(
    id,
    {
      budgetName: data.budgetName,
      totalAmount: data.totalAmount,
      categories: data.categories,
      notes: data.notes,
    },
    { new: true }
  );

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  return budget;
}

export async function approveBudget(id: string, approvedById: string) {
  const budget = await Budget.findByIdAndUpdate(
    id,
    {
      status: 'ACTIVE',
      approvedById,
      approvedAt: new Date(),
    },
    { new: true }
  );

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  logger.info('Budget approved', { budgetId: id });
  return budget;
}

export async function updateBudgetSpending(budgetId: string, categoryName: string, amount: number) {
  const budget = await Budget.findById(budgetId);

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  const category = budget.categories.find(c => c.categoryName === categoryName);
  if (!category) {
    throw new AppError('Category not found in budget', 404);
  }

  category.spentAmount += amount;

  await budget.save();

  return budget;
}

export async function getBudgetVsSpending(id: string) {
  const budget = await Budget.findById(id);

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  const breakdown = budget.categories.map(category => ({
    category: category.categoryName,
    allocated: category.allocatedAmount,
    spent: category.spentAmount,
    remaining: category.allocatedAmount - category.spentAmount,
    percentageUsed: (category.spentAmount / category.allocatedAmount) * 100,
  }));

  const totalAllocated = budget.totalAmount;
  const totalSpent = budget.categories.reduce((sum, c) => sum + c.spentAmount, 0);

  return {
    budget,
    breakdown,
    totalAllocated,
    totalSpent,
    totalRemaining: totalAllocated - totalSpent,
    percentageUsed: (totalSpent / totalAllocated) * 100,
  };
}

export async function deleteBudget(id: string) {
  const budget = await Budget.findByIdAndDelete(id);
  
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  return { success: true, message: 'Budget deleted' };
}
