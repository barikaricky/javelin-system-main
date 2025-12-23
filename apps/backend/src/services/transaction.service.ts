import { Transaction, Client, Invoice, User } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

export async function createTransaction(data: any, recordedById: string) {
  try {
    const transaction = await Transaction.create({
      ...data,
      recordedById,
      transactionDate: new Date(data.transactionDate),
      isClassified: !!data.category,
    });

    if (data.invoiceId) {
      await Invoice.findByIdAndUpdate(data.invoiceId, {
        status: 'PAID',
        paidDate: new Date(),
        paidAmount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentReference: data.referenceNumber,
      });
    }

    logger.info('Transaction created', { transactionId: transaction._id });
    return transaction;
  } catch (error) {
    logger.error('Create transaction error:', error);
    throw error;
  }
}

export async function getAllTransactions(filters?: any, page = 1, limit = 50) {
  const where: any = {};

  if (filters?.transactionType) where.transactionType = filters.transactionType;
  if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters?.category) where.category = filters.category;
  if (filters?.clientId) where.clientId = filters.clientId;
  if (filters?.startDate || filters?.endDate) {
    where.transactionDate = {};
    if (filters.startDate) where.transactionDate.$gte = new Date(filters.startDate);
    if (filters.endDate) where.transactionDate.$lte = new Date(filters.endDate);
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(where)
      .populate({ path: 'clientId', select: 'clientName companyName' })
      .populate({ path: 'recordedById', select: 'firstName lastName' })
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(where),
  ]);

  return {
    transactions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTransactionStats(startDate?: Date, endDate?: Date) {
  const where: any = {};
  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.$gte = startDate;
    if (endDate) where.transactionDate.$lte = endDate;
  }

  const [moneyIn, moneyOut, unclassified] = await Promise.all([
    Transaction.aggregate([
      { $match: { ...where, transactionType: 'MONEY_IN' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { ...where, transactionType: 'MONEY_OUT' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.countDocuments({ ...where, isClassified: false }),
  ]);

  return {
    moneyIn: { total: moneyIn[0]?.total || 0, count: moneyIn[0]?.count || 0 },
    moneyOut: { total: moneyOut[0]?.total || 0, count: moneyOut[0]?.count || 0 },
    unclassified,
    netCashFlow: (moneyIn[0]?.total || 0) - (moneyOut[0]?.total || 0),
  };
}
