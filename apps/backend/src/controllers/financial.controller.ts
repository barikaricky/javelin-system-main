import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { ITransaction } from '../models/Transaction.model';
import { IUser } from '../models/User.model';
import mongoose from 'mongoose';

const Transaction = mongoose.model<ITransaction>('Transaction');
const User = mongoose.model<IUser>('User');

interface FinancialOverviewQuery {
  month?: number;
  year?: number;
}

export const getFinancialOverview = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as unknown as FinancialOverviewQuery;

  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  // Build date range for the selected month
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  // Get all non-deleted transactions for the period
  const transactions = await Transaction.find({
    transactionDate: { $gte: startDate, $lte: endDate },
    deletedAt: { $exists: false }
  });

  // Calculate Money In (all MONEY_IN transactions)
  const totalMoneyIn = transactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_IN')
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  // Calculate Money Out (MONEY_OUT excluding salary category)
  const totalMoneyOut = transactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_OUT' && 
                 (!t.category || t.category.toUpperCase() !== 'SALARY'))
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  // Calculate Total Salary Obligation
  const users = await User.find({
    role: { $in: ['OPERATOR', 'SUPERVISOR', 'GENERAL_SUPERVISOR', 'MANAGER', 'SECRETARY'] },
    status: { $ne: 'INACTIVE' }
  });

  const totalSalaryObligation = users.reduce((sum: number, user: IUser) => sum + (user.monthlySalary || 0), 0);

  // Calculate Net Cash Position
  const netCashPosition = totalMoneyIn - totalMoneyOut - totalSalaryObligation;

  // Calculate Cash vs Transfer breakdown
  const cashTransactions = transactions.filter((t: ITransaction) => 
    t.transactionType === 'MONEY_IN' && t.paymentMethod === 'CASH'
  );
  const transferTransactions = transactions.filter((t: ITransaction) => 
    t.transactionType === 'MONEY_IN' && t.paymentMethod === 'BANK_TRANSFER'
  );

  const cashBreakdown = {
    cash: cashTransactions.reduce((sum: number, t: ITransaction) => sum + t.amount, 0),
    transfer: transferTransactions.reduce((sum: number, t: ITransaction) => sum + t.amount, 0)
  };

  // Calculate Outstanding Invoices (unclassified or pending MONEY_IN)
  const outstandingTransactions = await Transaction.find({
    transactionType: 'MONEY_IN',
    isClassified: false,
    deletedAt: { $exists: false },
    transactionDate: { $gte: startDate, $lte: endDate }
  });

  const outstandingInvoices = {
    count: outstandingTransactions.length,
    amount: outstandingTransactions.reduce((sum: number, t: ITransaction) => sum + t.amount, 0)
  };

  res.status(200).json({
    success: true,
    data: {
      totalMoneyIn,
      totalMoneyOut,
      totalSalaryObligation,
      netCashPosition,
      cashBreakdown,
      outstandingInvoices
    }
  });
});

export const getDailyLogs = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;

  const selectedDate = date ? new Date(date as string) : new Date();
  const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

  // Get all non-deleted transactions for the day
  const transactions = await Transaction.find({
    transactionDate: { $gte: startOfDay, $lte: endOfDay },
    deletedAt: { $exists: false }
  }).populate('recordedById', 'firstName lastName');

  // Separate Money In and Money Out
  const moneyInEntries = transactions.filter((t: ITransaction) => t.transactionType === 'MONEY_IN');
  const moneyOutEntries = transactions.filter((t: ITransaction) => t.transactionType === 'MONEY_OUT');

  // Calculate totals
  const totalMoneyIn = moneyInEntries.reduce((sum: number, t: ITransaction) => sum + t.amount, 0);
  const totalMoneyOut = moneyOutEntries
    .filter((t: ITransaction) => !t.category || t.category.toUpperCase() !== 'SALARY')
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  // Calculate daily salary impact (if salary payments were made this day)
  const dailySalaryImpact = moneyOutEntries
    .filter((t: ITransaction) => t.category && t.category.toUpperCase() === 'SALARY')
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  const dailyNetBalance = totalMoneyIn - totalMoneyOut - dailySalaryImpact;

  // Group by payment methods
  const paymentMethodsMap = new Map<string, { count: number; total: number }>();
  
  transactions.forEach((t: ITransaction) => {
    if (t.transactionType === 'MONEY_IN') {
      const method = t.paymentMethod;
      const existing = paymentMethodsMap.get(method) || { count: 0, total: 0 };
      paymentMethodsMap.set(method, {
        count: existing.count + 1,
        total: existing.total + t.amount
      });
    }
  });

  const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, data]) => ({
    method,
    count: data.count,
    total: data.total
  }));

  res.status(200).json({
    success: true,
    data: {
      date: startOfDay.toISOString().split('T')[0],
      totalMoneyIn,
      totalMoneyOut,
      dailySalaryImpact,
      dailyNetBalance,
      moneyInEntries,
      moneyOutEntries,
      paymentMethods
    }
  });
});

export const getMonthlyLogs = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as unknown as FinancialOverviewQuery;

  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  // Build date range for the selected month
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  // Get transactions for current month
  const transactions = await Transaction.find({
    transactionDate: { $gte: startDate, $lte: endDate },
    deletedAt: { $exists: false }
  }).populate('clientId', 'companyName');

  // Get previous month data for comparison
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
  const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

  const prevTransactions = await Transaction.find({
    transactionDate: { $gte: prevStartDate, $lte: prevEndDate },
    deletedAt: { $exists: false }
  });

  // Calculate current month totals
  const totalMoneyIn = transactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_IN')
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  const totalMoneyOut = transactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_OUT' && 
                 (!t.category || t.category.toUpperCase() !== 'SALARY'))
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  const totalSalary = transactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_OUT' && 
                 t.category && t.category.toUpperCase() === 'SALARY')
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  // Calculate previous month totals
  const prevTotalMoneyIn = prevTransactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_IN')
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  const prevTotalMoneyOut = prevTransactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_OUT' && 
                 (!t.category || t.category.toUpperCase() !== 'SALARY'))
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  const prevTotalSalary = prevTransactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_OUT' && 
                 t.category && t.category.toUpperCase() === 'SALARY')
    .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

  const netMonthlyPosition = totalMoneyIn - totalMoneyOut - totalSalary;

  // Category breakdown for Money Out
  const categoryMap = new Map<string, { total: number; count: number }>();
  transactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_OUT')
    .forEach((t: ITransaction) => {
      const category = t.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + t.amount,
        count: existing.count + 1
      });
    });

  const totalMoneyOutWithSalary = totalMoneyOut + totalSalary;
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    percentage: totalMoneyOutWithSalary > 0 ? (data.total / totalMoneyOutWithSalary) * 100 : 0
  })).sort((a, b) => b.total - a.total);

  // Client breakdown for Money In
  const clientMap = new Map<string, { clientName: string; total: number; count: number }>();
  transactions
    .filter((t: ITransaction) => t.transactionType === 'MONEY_IN' && t.clientId)
    .forEach((t: any) => {
      const clientId = t.clientId._id.toString();
      const clientName = t.clientId.companyName || 'Unknown Client';
      const existing = clientMap.get(clientId) || { clientName, total: 0, count: 0 };
      clientMap.set(clientId, {
        clientName,
        total: existing.total + t.amount,
        count: existing.count + 1
      });
    });

  const clientBreakdown = Array.from(clientMap.entries()).map(([clientId, data]) => ({
    clientId,
    clientName: data.clientName,
    total: data.total,
    count: data.count,
    percentage: totalMoneyIn > 0 ? (data.total / totalMoneyIn) * 100 : 0
  })).sort((a, b) => b.total - a.total);

  // Comparison calculations
  const calculateComparison = (current: number, previous: number) => {
    const difference = current - previous;
    const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0;
    let trend: 'increase' | 'decrease' | 'stable' = 'stable';
    
    if (Math.abs(percentageChange) < 1) {
      trend = 'stable';
    } else if (difference > 0) {
      trend = 'increase';
    } else {
      trend = 'decrease';
    }

    return {
      currentMonth: current,
      previousMonth: previous,
      difference,
      percentageChange,
      trend
    };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  res.status(200).json({
    success: true,
    data: {
      month: currentMonth,
      year: currentYear,
      monthName: monthNames[currentMonth - 1],
      totalMoneyIn,
      totalMoneyOut,
      totalSalary,
      netMonthlyPosition,
      categoryBreakdown,
      clientBreakdown,
      comparison: {
        moneyIn: calculateComparison(totalMoneyIn, prevTotalMoneyIn),
        moneyOut: calculateComparison(totalMoneyOut, prevTotalMoneyOut),
        salary: calculateComparison(totalSalary, prevTotalSalary)
      }
    }
  });
});
