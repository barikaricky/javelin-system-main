import BitExpense, { IBitExpense } from '../models/BitExpense.model';
import { Beat } from '../models/Bit.model';
import { User } from '../models/User.model';
import { Location } from '../models/Location.model';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Category labels
export const EXPENSE_CATEGORIES = {
  EQUIPMENT: 'Equipment Purchase',
  UNIFORMS: 'Uniforms',
  TRANSPORTATION: 'Transportation',
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
  REPAIRS: 'Repairs',
  LOGISTICS: 'Logistics',
  EMERGENCY: 'Emergency Expenses',
  UTILITIES: 'Utilities',
  CONSUMABLES: 'Consumables',
  OTHER: 'Other',
};

// Create expense
export async function createBitExpense(data: {
  beatId?: string;
  locationId?: string;
  category: string;
  description: string;
  amount: number;
  dateIncurred: Date;
  paymentMethod: string;
  userId: string;
  receiptUrl?: string;
  notes?: string;
}) {
  try {
    const user = await User.findById(data.userId).select('firstName lastName role');
    if (!user) {
      throw new Error('User not found');
    }

    logger.info('Creating BitExpense with data:', { beatId: data.beatId, locationId: data.locationId });

    let bitData: any = {};
    let isUnallocated = false;

    if (data.beatId) {
      logger.info('Looking up BEAT with ID:', data.beatId);
      const bit = await Beat.findById(data.beatId)
        .populate('clientId', 'companyName')
        .populate('locationId', 'locationName city state');
      
      logger.info('BEAT lookup result:', { 
        found: !!bit, 
        beatName: bit?.beatName,
        locationId: bit?.locationId,
        locationPopulated: bit?.locationId ? typeof bit.locationId === 'object' : false
      });
      
      if (!bit) {
        logger.error('BEAT not found for ID:', data.beatId);
        throw new Error(`BEAT not found with ID: ${data.beatId}`);
      }
      
      const populatedLocation = bit.locationId as any;
      const locationName = populatedLocation?.locationName || 'Unknown Location';
      
      logger.info('Location details:', {
        locationId: populatedLocation?._id,
        locationName: locationName,
        fullLocation: populatedLocation
      });
      
      bitData = {
        beatId: bit._id,
        beatName: bit.beatName,
        clientName: (bit.clientId as any)?.companyName || 'Unknown Client',
        locationName: locationName,
      };
    } else if (data.locationId) {
      // No BEAT but has location - unallocated to specific location
      const location = await Location.findById(data.locationId);
      if (!location) {
        throw new Error('Location not found');
      }
      isUnallocated = true;
      bitData = {
        beatName: 'Unallocated',
        locationName: location.locationName,
      };
    } else {
      // No BEAT and no location
      isUnallocated = true;
      bitData = {
        beatName: 'Unallocated',
        locationName: 'No Location',
      };
    }

    logger.info('BitData prepared:', bitData);

    const expense = await BitExpense.create({
      ...bitData,
      category: data.category,
      description: data.description,
      amount: data.amount,
      dateIncurred: data.dateIncurred,
      paymentMethod: data.paymentMethod,
      isUnallocated,
      addedBy: user._id,
      addedByName: `${user.firstName} ${user.lastName}`,
      addedByRole: user.role,
      receiptUrl: data.receiptUrl,
      notes: data.notes,
    });

    logger.info(`BitExpense created by ${user.firstName} ${user.lastName}`, { expenseId: expense._id });
    return expense.toJSON();
  } catch (error) {
    logger.error('Create BitExpense error:', error);
    throw error;
  }
}

// Get expenses with filters
export async function getBitExpenses(filters: {
  beatId?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
  isUnallocated?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    const {
      beatId,
      category,
      startDate,
      endDate,
      paymentMethod,
      isUnallocated,
      search,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc',
    } = filters;

    const query: any = { isDeleted: false };

    if (beatId) query.beatId = beatId;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (isUnallocated !== undefined) query.isUnallocated = isUnallocated;

    if (startDate || endDate) {
      query.dateIncurred = {};
      if (startDate) query.dateIncurred.$gte = new Date(startDate);
      if (endDate) query.dateIncurred.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { description: new RegExp(search, 'i') },
        { beatName: new RegExp(search, 'i') },
        { clientName: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
      ];
    }

    const sortOptions: any = {};
    if (sortBy === 'date') sortOptions.dateIncurred = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'amount') sortOptions.amount = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'category') sortOptions.category = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      BitExpense.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      BitExpense.countDocuments(query),
    ]);

    return {
      expenses: expenses.map(e => ({ ...e, id: e._id.toString() })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get BitExpenses error:', error);
    throw error;
  }
}

// Get expense by ID
export async function getBitExpenseById(id: string) {
  try {
    const expense = await BitExpense.findOne({ _id: id, isDeleted: false });
    if (!expense) {
      throw new Error('Expense not found');
    }
    return expense.toJSON();
  } catch (error) {
    logger.error('Get BitExpense by ID error:', error);
    throw error;
  }
}

// Update expense
export async function updateBitExpense(
  id: string,
  data: {
    beatId?: string;
    locationId?: string;
    category?: string;
    description?: string;
    amount?: number;
    dateIncurred?: Date;
    paymentMethod?: string;
    receiptUrl?: string;
    notes?: string;
  },
  userId: string
) {
  try {
    const user = await User.findById(userId).select('firstName lastName role');
    if (!user) {
      throw new Error('User not found');
    }

    const expense = await BitExpense.findOne({ _id: id, isDeleted: false });
    if (!expense) {
      throw new Error('Expense not found');
    }

    // If BEAT is being changed
    if (data.beatId && data.beatId !== expense.beatId?.toString()) {
      const bit = await Beat.findById(data.beatId).populate('clientId', 'companyName').populate('locationId', 'locationName');
      if (!bit) {
        throw new Error('BEAT not found');
      }
      expense.beatId = bit._id as any;
      expense.beatName = bit.beatName;
      expense.clientName = (bit.clientId as any)?.companyName || 'Unknown Client';
      expense.locationName = (bit.locationId as any)?.locationName || 'Unknown Location';
      expense.isUnallocated = false;
    } else if (data.locationId && (!data.beatId || data.beatId === '')) {
      // Location changed but no BEAT (unallocated)
      const location = await Location.findById(data.locationId);
      if (location) {
        expense.locationName = location.locationName;
        expense.beatId = undefined;
        expense.beatName = 'Unallocated';
        expense.clientName = undefined;
        expense.isUnallocated = true;
      }
    }

    if (data.category) expense.category = data.category as any;
    if (data.description) expense.description = data.description;
    if (data.amount !== undefined) expense.amount = data.amount;
    if (data.dateIncurred) expense.dateIncurred = data.dateIncurred;
    if (data.paymentMethod) expense.paymentMethod = data.paymentMethod as any;
    if (data.receiptUrl !== undefined) expense.receiptUrl = data.receiptUrl;
    if (data.notes !== undefined) expense.notes = data.notes;

    expense.lastEditedBy = user._id as any;
    expense.lastEditedByName = `${user.firstName} ${user.lastName}`;
    expense.lastEditedAt = new Date();

    await expense.save();
    logger.info(`BitExpense updated by ${user.firstName} ${user.lastName}`, { expenseId: expense._id });
    return expense.toJSON();
  } catch (error) {
    logger.error('Update BitExpense error:', error);
    throw error;
  }
}

// Delete expense (soft delete - Director only)
export async function deleteBitExpense(id: string, userId: string) {
  try {
    const user = await User.findById(userId).select('firstName lastName role');
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'DIRECTOR') {
      throw new Error('Only Directors can delete expenses');
    }

    const expense = await BitExpense.findOne({ _id: id, isDeleted: false });
    if (!expense) {
      throw new Error('Expense not found');
    }

    expense.isDeleted = true;
    expense.deletedBy = user._id as any;
    expense.deletedByName = `${user.firstName} ${user.lastName}`;
    expense.deletedAt = new Date();

    await expense.save();
    logger.info(`BitExpense deleted by ${user.firstName} ${user.lastName}`, { expenseId: expense._id });
    return { message: 'Expense deleted successfully' };
  } catch (error) {
    logger.error('Delete BitExpense error:', error);
    throw error;
  }
}

// Delete all expenses for a BEAT (soft delete - Director only)
export async function deleteAllBitExpenses(beatId: string, userId: string) {
  try {
    const user = await User.findById(userId).select('firstName lastName role');
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'DIRECTOR') {
      throw new Error('Only Directors can delete expenses');
    }

    const result = await BitExpense.updateMany(
      { beatId, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: user._id,
          deletedByName: `${user.firstName} ${user.lastName}`,
        },
      }
    );

    logger.info(`Deleted ${result.modifiedCount} expenses for BEAT ${beatId}`);
    return { count: result.modifiedCount, message: `${result.modifiedCount} expenses deleted successfully` };
  } catch (error) {
    logger.error('Delete all BEAT expenses error:', error);
    throw error;
  }
}

// Get BEAT summary
export async function getBitExpenseSummary(beatId: string, period: 'week' | 'month' | 'year' = 'month') {
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const expenses = await BitExpense.find({
      beatId,
      isDeleted: false,
      dateIncurred: { $gte: startDate },
    }).lean();

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseCount = expenses.length;

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc: any, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = { count: 0, total: 0 };
      }
      acc[exp.category].count++;
      acc[exp.category].total += exp.amount;
      return acc;
    }, {});

    // Last expense
    const lastExpense = expenses.length > 0 ? expenses.sort((a, b) => 
      new Date(b.dateIncurred).getTime() - new Date(a.dateIncurred).getTime()
    )[0] : null;

    return {
      period,
      totalAmount,
      expenseCount,
      averageExpense: expenseCount > 0 ? totalAmount / expenseCount : 0,
      categoryBreakdown,
      lastExpenseDate: lastExpense?.dateIncurred || null,
    };
  } catch (error) {
    logger.error('Get BEAT expense summary error:', error);
    throw error;
  }
}

// Get all BEATs with expense summaries
export async function getBitsWithExpenseSummary(period: 'week' | 'month' | 'year' = 'month') {
  try {
    const beats = await Beat.find({ isActive: true })
      .populate('clientId', 'companyName')
      .populate('locationId', 'locationName')
      .lean();

    const bitsWithExpenses = await Promise.all(
      beats.map(async (bit) => {
        const summary = await getBitExpenseSummary(bit._id.toString(), period);
        return {
          id: bit._id.toString(),
          name: bit.beatName,
          clientName: (bit.clientId as any)?.companyName || 'Unknown Client',
          locationName: (bit.locationId as any)?.locationName || 'Unknown Location',
          ...summary,
        };
      })
    );

    // Only return BEATs that have at least one expense
    const bitsWithActualExpenses = bitsWithExpenses.filter(bit => bit.expenseCount > 0);

    return bitsWithActualExpenses.sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error) {
    logger.error('Get BEATs with expense summary error:', error);
    throw error;
  }
}

// Get expense statistics
export async function getExpenseStatistics(filters: {
  beatId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const query: any = { isDeleted: false };
    if (filters.beatId) query.beatId = filters.beatId;
    if (filters.startDate || filters.endDate) {
      query.dateIncurred = {};
      if (filters.startDate) query.dateIncurred.$gte = new Date(filters.startDate);
      if (filters.endDate) query.dateIncurred.$lte = new Date(filters.endDate);
    }

    const expenses = await BitExpense.find(query).lean();

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryStats = expenses.reduce((acc: any, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = { count: 0, total: 0, percentage: 0 };
      }
      acc[exp.category].count++;
      acc[exp.category].total += exp.amount;
      return acc;
    }, {});

    // Calculate percentages
    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].percentage = totalAmount > 0 ? (categoryStats[cat].total / totalAmount) * 100 : 0;
    });

    return {
      totalAmount,
      totalCount: expenses.length,
      averageExpense: expenses.length > 0 ? totalAmount / expenses.length : 0,
      categoryStats,
    };
  } catch (error) {
    logger.error('Get expense statistics error:', error);
    throw error;
  }
}
