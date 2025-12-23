import mongoose from 'mongoose';
import { Transaction, ITransaction, IEditHistory } from '../models/Transaction.model';
import { Invoice } from '../models/Invoice.model';
import { AuditLog } from '../models/AuditLog.model';
import { AppError } from '../middlewares/error.middleware';

interface CreateMoneyInData {
  amount: number;
  transactionDate: Date | string;
  source: 'CLIENT' | 'INVOICE' | 'STAFF' | 'ASSET_SALE' | 'LOAN' | 'CAPITAL_INJECTION' | 'MISCELLANEOUS';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY' | 'POS' | 'OTHER';
  description: string;
  clientId?: string;
  invoiceId?: string;
  referenceNumber?: string;
  receiptNumber?: string;
  bankName?: string;
  accountNumber?: string;
  attachments: string[]; // Base64 encoded receipts/bank alerts
  notes?: string;
  category?: string;
}

interface UpdateMoneyInData extends Partial<CreateMoneyInData> {
  reason: string; // Required for all edits
}

interface MoneyInFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  source?: string;
  clientId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

interface DailyReconciliation {
  date: string;
  totalCash: number;
  totalTransfer: number;
  totalPOS: number;
  totalCheque: number;
  totalMobile: number;
  totalOther: number;
  grandTotal: number;
  recordCount: number;
  isClosed: boolean;
  unclassifiedCount: number;
  missingEvidenceCount: number;
}

/**
 * Create a new Money In record
 * - Validates mandatory fields
 * - Auto-updates linked invoice status (full/partial payment)
 * - Logs to AuditLog
 * - Sends notification to Director if invoice mismatch detected
 */
export async function createMoneyIn(
  data: CreateMoneyInData,
  recordedById: string
): Promise<ITransaction> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate mandatory fields
    if (!data.amount || data.amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }
    if (!data.transactionDate) {
      throw new AppError('Transaction date is required', 400);
    }
    if (!data.paymentMethod) {
      throw new AppError('Payment method is required', 400);
    }
    if (!data.source) {
      throw new AppError('Source of funds is required', 400);
    }
    if (!data.attachments || data.attachments.length === 0) {
      throw new AppError('Evidence (receipt or bank alert) is required', 400);
    }

    // Validate Cash entries require receipt number
    if (data.paymentMethod === 'CASH' && !data.receiptNumber) {
      throw new AppError('Receipt number is required for Cash payments', 400);
    }

    // Validate Transfer entries require reference number
    if (['BANK_TRANSFER', 'POS'].includes(data.paymentMethod) && !data.referenceNumber) {
      throw new AppError('Reference number is required for bank transfers', 400);
    }

    // Validate client link if source is CLIENT or INVOICE
    if ((data.source === 'CLIENT' || data.source === 'INVOICE') && !data.clientId) {
      throw new AppError('Client is required for this source type', 400);
    }

    // Create the Money In transaction
    const transaction = new Transaction({
      ...data,
      transactionType: 'MONEY_IN',
      transactionDate: new Date(data.transactionDate),
      recordedById: new mongoose.Types.ObjectId(recordedById),
      clientId: data.clientId ? new mongoose.Types.ObjectId(data.clientId) : undefined,
      invoiceId: data.invoiceId ? new mongoose.Types.ObjectId(data.invoiceId) : undefined,
      isClassified: !!data.category,
      currency: 'NGN'
    });

    await transaction.save({ session });

    // Auto-update invoice status if linked (FURTHER CONSIDERATION #1)
    if (data.invoiceId) {
      const invoice = await Invoice.findById(data.invoiceId).session(session);
      
      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      const previousPaidAmount = invoice.paidAmount || 0;
      const newPaidAmount = previousPaidAmount + data.amount;
      
      let newStatus: 'PENDING' | 'SENT' | 'OVERDUE' | 'PAID' | 'CANCELLED';
      
      if (newPaidAmount >= invoice.amount) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'SENT'; // Partially paid keeps as SENT
      } else {
        newStatus = invoice.status;
      }

      await Invoice.findByIdAndUpdate(
        data.invoiceId,
        {
          $set: {
            paidAmount: newPaidAmount,
            status: newStatus,
            paidDate: newStatus === 'PAID' ? new Date() : invoice.paidDate,
            paymentMethod: data.paymentMethod,
            paymentReference: data.referenceNumber || data.receiptNumber
          }
        },
        { session }
      );

      // Flag invoice mismatch if overpaid or underpaid (notification to Director)
      if (newPaidAmount > invoice.amount) {
        await AuditLog.create([{
          userId: new mongoose.Types.ObjectId(recordedById),
          action: 'MONEY_IN_INVOICE_OVERPAID',
          entityType: 'Transaction',
          entityId: transaction._id.toString(),
          metadata: {
            invoiceId: invoice._id,
            invoiceAmount: invoice.amount,
            totalPaid: newPaidAmount,
            overpayment: newPaidAmount - invoice.amount,
            alert: 'Invoice overpaid - requires Director review'
          },
          timestamp: new Date()
        }], { session });
      } else if (newPaidAmount < invoice.amount && newStatus !== 'PAID') {
        await AuditLog.create([{
          userId: new mongoose.Types.ObjectId(recordedById),
          action: 'MONEY_IN_INVOICE_PARTIAL_PAYMENT',
          entityType: 'Transaction',
          entityId: transaction._id.toString(),
          metadata: {
            invoiceId: invoice._id,
            invoiceAmount: invoice.amount,
            totalPaid: newPaidAmount,
            remaining: invoice.amount - newPaidAmount,
            info: 'Partial payment recorded'
          },
          timestamp: new Date()
        }], { session });
      }
    }

    // Log to AuditLog
    await AuditLog.create([{
      userId: new mongoose.Types.ObjectId(recordedById),
      action: 'MONEY_IN_CREATED',
      entityType: 'Transaction',
      entityId: transaction._id.toString(),
      metadata: {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        source: data.source,
        transactionDate: data.transactionDate
      },
      timestamp: new Date()
    }], { session });

    await session.commitTransaction();
    
    // Return with populated fields
    const result = await Transaction.findById(transaction._id)
      .populate('clientId', 'clientName companyName')
      .populate('invoiceId', 'invoiceNumber amount status')
      .populate('recordedById', 'firstName lastName email')
      .lean();
    
    return result as unknown as ITransaction;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Update an existing Money In record
 * - Tracks all field-level changes
 * - Requires reason for edit
 * - Updates invoice status if amount/invoice changes
 * - Appends to editHistory array
 */
export async function editMoneyIn(
  transactionId: string,
  updates: UpdateMoneyInData,
  userId: string,
  userRole: string
): Promise<ITransaction> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate edit permission (Secretary or Director only)
    if (!['SECRETARY', 'DIRECTOR'].includes(userRole)) {
      throw new AppError('Only Secretary or Director can edit Money In records', 403);
    }

    // Require reason for edit
    if (!updates.reason || updates.reason.trim().length === 0) {
      throw new AppError('Reason is required for editing Money In records', 400);
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      transactionType: 'MONEY_IN',
      deletedAt: null
    }).session(session);

    if (!transaction) {
      throw new AppError('Money In record not found or has been deleted', 404);
    }

    // Track changes before updating
    const changeHistory: IEditHistory = {
      editedAt: new Date(),
      editedById: new mongoose.Types.ObjectId(userId),
      changes: [],
      reason: updates.reason
    };

    const fieldsToTrack = [
      'amount', 'transactionDate', 'paymentMethod', 'description',
      'source', 'clientId', 'invoiceId', 'referenceNumber', 
      'receiptNumber', 'bankName', 'accountNumber', 'notes', 'attachments'
    ];

    fieldsToTrack.forEach(field => {
      const oldValue = transaction[field as keyof ITransaction];
      const newValue = updates[field as keyof UpdateMoneyInData];
      
      if (newValue !== undefined && JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changeHistory.changes.push({
          field,
          oldValue,
          newValue
        });
      }
    });

    // Only proceed if there are actual changes
    if (changeHistory.changes.length === 0) {
      throw new AppError('No changes detected', 400);
    }

    // Update invoice if amount or invoiceId changed
    const amountChanged = updates.amount && updates.amount !== transaction.amount;
    const invoiceChanged = updates.invoiceId && updates.invoiceId !== transaction.invoiceId?.toString();

    if (amountChanged || invoiceChanged) {
      // Reverse old invoice payment if it was linked
      if (transaction.invoiceId) {
        const oldInvoice = await Invoice.findById(transaction.invoiceId).session(session);
        if (oldInvoice) {
          const newPaidAmount = Math.max(0, (oldInvoice.paidAmount || 0) - transaction.amount);
          await Invoice.findByIdAndUpdate(
            transaction.invoiceId,
            {
              $set: {
                paidAmount: newPaidAmount,
                status: newPaidAmount === 0 ? 'SENT' : 
                        newPaidAmount >= oldInvoice.amount ? 'PAID' : 'SENT'
              }
            },
            { session }
          );
        }
      }

      // Apply new invoice payment
      const newInvoiceId = updates.invoiceId || transaction.invoiceId;
      const newAmount = updates.amount || transaction.amount;

      if (newInvoiceId) {
        const newInvoice = await Invoice.findById(newInvoiceId).session(session);
        if (newInvoice) {
          const updatedPaidAmount = (newInvoice.paidAmount || 0) + newAmount;
          await Invoice.findByIdAndUpdate(
            newInvoiceId,
            {
              $set: {
                paidAmount: updatedPaidAmount,
                status: updatedPaidAmount >= newInvoice.amount ? 'PAID' : 'SENT',
                paidDate: updatedPaidAmount >= newInvoice.amount ? new Date() : newInvoice.paidDate
              }
            },
            { session }
          );
        }
      }
    }

    // Apply updates to transaction
    Object.keys(updates).forEach(key => {
      if (key !== 'reason' && updates[key as keyof UpdateMoneyInData] !== undefined) {
        (transaction as any)[key] = updates[key as keyof UpdateMoneyInData];
      }
    });

    // Append to edit history
    if (!transaction.editHistory) {
      transaction.editHistory = [];
    }
    transaction.editHistory.push(changeHistory);

    await transaction.save({ session });

    // Log to AuditLog
    await AuditLog.create([{
      userId: new mongoose.Types.ObjectId(userId),
      action: 'MONEY_IN_EDITED',
      entityType: 'Transaction',
      entityId: transaction._id.toString(),
      metadata: {
        changes: changeHistory.changes,
        reason: updates.reason
      },
      timestamp: new Date()
    }], { session });

    await session.commitTransaction();

    const result = await Transaction.findById(transaction._id)
      .populate('clientId', 'clientName companyName')
      .populate('invoiceId', 'invoiceNumber amount status')
      .populate('recordedById', 'firstName lastName email')
      .populate('editHistory.editedById', 'firstName lastName')
      .lean();
    
    return result as unknown as ITransaction;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Soft delete a Money In record (Director only)
 * - Requires confirmation and reason
 * - Archives record (sets deletedAt, deletedById, deletionReason)
 * - Reverses invoice payment if linked
 * - Record remains in database and audit logs
 */
export async function softDeleteMoneyIn(
  transactionId: string,
  userId: string,
  userRole: string,
  reason: string
): Promise<{ message: string; archivedRecord: ITransaction }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Enforce Director-only deletion
    if (userRole !== 'DIRECTOR') {
      throw new AppError('Only Director can delete Money In records', 403);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError('Reason is required for deleting Money In records', 400);
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      transactionType: 'MONEY_IN',
      deletedAt: null
    }).session(session);

    if (!transaction) {
      throw new AppError('Money In record not found or already deleted', 404);
    }

    // Reverse invoice payment if linked
    if (transaction.invoiceId) {
      const invoice = await Invoice.findById(transaction.invoiceId).session(session);
      if (invoice) {
        const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - transaction.amount);
        await Invoice.findByIdAndUpdate(
          transaction.invoiceId,
          {
            $set: {
              paidAmount: newPaidAmount,
              status: newPaidAmount === 0 ? 'SENT' : 
                      newPaidAmount >= invoice.amount ? 'PAID' : 'SENT',
              paidDate: newPaidAmount >= invoice.amount ? invoice.paidDate : null
            }
          },
          { session }
        );
      }
    }

    // Soft delete (archive)
    transaction.deletedAt = new Date();
    transaction.deletedById = new mongoose.Types.ObjectId(userId);
    transaction.deletionReason = reason;

    await transaction.save({ session });

    // Log to AuditLog
    await AuditLog.create([{
      userId: new mongoose.Types.ObjectId(userId),
      action: 'MONEY_IN_DELETED',
      entityType: 'Transaction',
      entityId: transaction._id.toString(),
      metadata: {
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        deletionReason: reason,
        warning: 'Record archived - visible in audit logs only'
      },
      timestamp: new Date()
    }], { session });

    await session.commitTransaction();

    return {
      message: 'Money In record deleted and archived successfully',
      archivedRecord: transaction.toObject()
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get Money In records with role-based filtering
 * - Manager: Can view all active records (read-only)
 * - Secretary/Director: Can view all records including edit history
 * - Supports filters: date range, payment method, source, client, amount range
 */
export async function getMoneyInRecords(
  filters: MoneyInFilters,
  page: number = 1,
  limit: number = 50,
  userRole: string,
  includeDeleted: boolean = false
): Promise<{ records: ITransaction[]; pagination: any; summary: any }> {
  // Build query
  const query: any = { transactionType: 'MONEY_IN' };

  // Exclude deleted records unless explicitly requested (Director only)
  if (!includeDeleted || userRole !== 'DIRECTOR') {
    query.deletedAt = null;
  }

  if (filters.startDate || filters.endDate) {
    query.transactionDate = {};
    if (filters.startDate) {
      query.transactionDate.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.transactionDate.$lte = new Date(filters.endDate);
    }
  }

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.source) {
    query.source = filters.source;
  }

  if (filters.clientId) {
    query.clientId = new mongoose.Types.ObjectId(filters.clientId);
  }

  if (filters.minAmount || filters.maxAmount) {
    query.amount = {};
    if (filters.minAmount) {
      query.amount.$gte = filters.minAmount;
    }
    if (filters.maxAmount) {
      query.amount.$lte = filters.maxAmount;
    }
  }

  if (filters.search) {
    query.$or = [
      { description: { $regex: filters.search, $options: 'i' } },
      { referenceNumber: { $regex: filters.search, $options: 'i' } },
      { receiptNumber: { $regex: filters.search, $options: 'i' } },
      { notes: { $regex: filters.search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const [records, total] = await Promise.all([
    Transaction.find(query)
      .populate('clientId', 'clientName companyName email phone')
      .populate('invoiceId', 'invoiceNumber amount status paidAmount')
      .populate('recordedById', 'firstName lastName email role')
      .populate('editHistory.editedById', 'firstName lastName')
      .populate('deletedById', 'firstName lastName')
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query)
  ]);

  // Calculate summary statistics
  const summaryPipeline: any[] = [
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCash: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, '$amount', 0] }
        },
        totalTransfer: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'BANK_TRANSFER'] }, '$amount', 0] }
        },
        totalPOS: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'POS'] }, '$amount', 0] }
        },
        totalCheque: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'CHEQUE'] }, '$amount', 0] }
        },
        count: { $sum: 1 },
        unclassifiedCount: {
          $sum: { $cond: [{ $eq: ['$isClassified', false] }, 1, 0] }
        }
      }
    }
  ];

  const summaryResult = await Transaction.aggregate(summaryPipeline);
  const summary = summaryResult[0] || {
    totalAmount: 0,
    totalCash: 0,
    totalTransfer: 0,
    totalPOS: 0,
    totalCheque: 0,
    count: 0,
    unclassifiedCount: 0
  };

  return {
    records: records as unknown as ITransaction[],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    summary
  };
}

/**
 * Get daily reconciliation report (FURTHER CONSIDERATION #2)
 * - Shows total Money In by payment method for specified date
 * - Flags incomplete records (missing evidence, unclassified)
 * - Soft warning system (no hard locks, allows late entries with reason)
 */
export async function getDailyReconciliation(
  date: string
): Promise<DailyReconciliation> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    transactionType: 'MONEY_IN',
    transactionDate: { $gte: startOfDay, $lte: endOfDay },
    deletedAt: null
  };

  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: null,
        totalCash: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, '$amount', 0] }
        },
        totalTransfer: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'BANK_TRANSFER'] }, '$amount', 0] }
        },
        totalPOS: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'POS'] }, '$amount', 0] }
        },
        totalCheque: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'CHEQUE'] }, '$amount', 0] }
        },
        totalMobile: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'MOBILE_MONEY'] }, '$amount', 0] }
        },
        totalOther: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'OTHER'] }, '$amount', 0] }
        },
        grandTotal: { $sum: '$amount' },
        recordCount: { $sum: 1 },
        unclassifiedCount: {
          $sum: { $cond: [{ $eq: ['$isClassified', false] }, 1, 0] }
        },
        missingEvidenceCount: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$attachments', []] },
                  { $eq: ['$attachments', null] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ];

  const result = await Transaction.aggregate(pipeline);
  const data = result[0] || {
    totalCash: 0,
    totalTransfer: 0,
    totalPOS: 0,
    totalCheque: 0,
    totalMobile: 0,
    totalOther: 0,
    grandTotal: 0,
    recordCount: 0,
    unclassifiedCount: 0,
    missingEvidenceCount: 0
  };

  // Determine if day is "closed" (soft enforcement - warning only)
  const now = new Date();
  const isToday = startOfDay.toDateString() === now.toDateString();
  const isClosed = !isToday && data.unclassifiedCount === 0 && data.missingEvidenceCount === 0;

  return {
    date,
    ...data,
    isClosed
  };
}

/**
 * Get Money In statistics for dashboard
 */
export async function getMoneyInStats(
  startDate?: string,
  endDate?: string
): Promise<any> {
  const query: any = { 
    transactionType: 'MONEY_IN',
    deletedAt: null
  };

  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) {
      query.transactionDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.transactionDate.$lte = new Date(endDate);
    }
  }

  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalRecords: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        totalCash: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, '$amount', 0] }
        },
        totalTransfer: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'BANK_TRANSFER'] }, '$amount', 0] }
        },
        bySource: {
          $push: {
            source: '$source',
            amount: '$amount'
          }
        }
      }
    }
  ];

  const result = await Transaction.aggregate(pipeline);
  const stats = result[0] || {
    totalAmount: 0,
    totalRecords: 0,
    avgAmount: 0,
    totalCash: 0,
    totalTransfer: 0
  };

  return stats;
}

/**
 * Get edit history for a specific Money In record
 */
export async function getMoneyInHistory(
  transactionId: string
): Promise<IEditHistory[]> {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    transactionType: 'MONEY_IN'
  })
    .populate('editHistory.editedById', 'firstName lastName email')
    .lean();

  if (!transaction) {
    throw new AppError('Money In record not found', 404);
  }

  return transaction.editHistory || [];
}
