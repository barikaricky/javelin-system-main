import { Invoice, Client, Transaction } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

export async function createInvoice(data: any, createdById: string) {
  try {
    const client = await Client.findById(data.clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const invoiceNumber = generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      clientId: data.clientId,
      amount: data.amount,
      currency: data.currency || 'NGN',
      description: data.description,
      serviceType: data.serviceType,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: new Date(data.dueDate),
      status: 'PENDING',
      notes: data.notes,
      attachments: data.attachments || [],
      createdById,
    });

    logger.info('Invoice created', { invoiceId: invoice._id, invoiceNumber });
    
    return await Invoice.findById(invoice._id)
      .populate({ path: 'clientId', select: 'clientName companyName email' })
      .populate({ path: 'createdById', select: 'firstName lastName' });
  } catch (error) {
    logger.error('Create invoice error:', error);
    throw error;
  }
}

export async function getAllInvoices(filters?: any, page = 1, limit = 50) {
  const where: any = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.clientId) where.clientId = filters.clientId;
  if (filters?.startDate || filters?.endDate) {
    where.invoiceDate = {};
    if (filters.startDate) where.invoiceDate.$gte = new Date(filters.startDate);
    if (filters.endDate) where.invoiceDate.$lte = new Date(filters.endDate);
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(where)
      .populate({ path: 'clientId', select: 'clientName companyName email' })
      .populate({ path: 'createdById', select: 'firstName lastName' })
      .sort({ invoiceDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Invoice.countDocuments(where),
  ]);

  return {
    invoices,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getInvoiceById(id: string) {
  const invoice = await Invoice.findById(id)
    .populate({ path: 'clientId' })
    .populate({ path: 'createdById', select: 'firstName lastName email' });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const payments = await Transaction.find({
    invoiceId: id,
    transactionType: 'MONEY_IN',
  }).sort({ transactionDate: -1 });

  return {
    ...invoice.toObject(),
    payments,
  };
}

export async function updateInvoice(id: string, data: any) {
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    {
      amount: data.amount,
      description: data.description,
      serviceType: data.serviceType,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes,
    },
    { new: true }
  ).populate({ path: 'clientId' });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  return invoice;
}

export async function markInvoiceAsSent(id: string) {
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    {
      status: 'SENT',
      sentDate: new Date(),
    },
    { new: true }
  ).populate({ path: 'clientId' });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  return invoice;
}

export async function markInvoiceAsPaid(id: string, data: any) {
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    {
      status: 'PAID',
      paidDate: new Date(data.paidDate),
      paidAmount: data.paidAmount,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
    },
    { new: true }
  ).populate({ path: 'clientId' });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  return invoice;
}

export async function cancelInvoice(id: string, reason?: string) {
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    {
      status: 'CANCELLED',
      notes: reason || invoice?.notes,
    },
    { new: true }
  ).populate({ path: 'clientId' });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  return invoice;
}

export async function sendInvoiceReminder(id: string) {
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    {
      $inc: { remindersSent: 1 },
      lastReminderDate: new Date(),
    },
    { new: true }
  ).populate({ path: 'clientId' });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // TODO: Send email reminder to client

  logger.info('Invoice reminder sent', { invoiceId: id });
  return invoice;
}

export async function getInvoiceStats() {
  const [pending, sent, overdue, paid, cancelled] = await Promise.all([
    Invoice.countDocuments({ status: 'PENDING' }),
    Invoice.countDocuments({ status: 'SENT' }),
    Invoice.countDocuments({ status: 'OVERDUE' }),
    Invoice.countDocuments({ status: 'PAID' }),
    Invoice.countDocuments({ status: 'CANCELLED' }),
  ]);

  const [totalPending, totalOverdue, totalPaid] = await Promise.all([
    Invoice.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.aggregate([
      { $match: { status: 'OVERDUE' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
  ]);

  return {
    counts: { pending, sent, overdue, paid, cancelled },
    amounts: {
      pending: totalPending[0]?.total || 0,
      overdue: totalOverdue[0]?.total || 0,
      paid: totalPaid[0]?.total || 0,
    },
  };
}

export async function getOverdueInvoices() {
  const now = new Date();
  
  const overdueInvoices = await Invoice.find({
    status: { $in: ['PENDING', 'SENT'] },
    dueDate: { $lt: now },
  }).populate({ path: 'clientId', select: 'clientName companyName email' });

  // Auto-update status to OVERDUE
  await Invoice.updateMany(
    {
      status: { $in: ['PENDING', 'SENT'] },
      dueDate: { $lt: now },
    },
    { status: 'OVERDUE' }
  );

  return overdueInvoices;
}

export async function getClientInvoiceHistory(clientId: string) {
  const invoices = await Invoice.find({ clientId })
    .sort({ invoiceDate: -1 });

  const stats = await Invoice.aggregate([
    { $match: { clientId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
  ]);

  return { invoices, stats };
}
