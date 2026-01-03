import MoneyOut, { IMoneyOut, MONEY_OUT_CATEGORIES, BENEFICIARY_TYPES } from '../models/MoneyOut.model';
import { AuditLog } from '../models/AuditLog.model';
import mongoose from 'mongoose';

export class MoneyOutService {
  
  // ========================================
  // CREATE MONEY OUT REQUEST
  // ========================================
  async createMoneyOut(data: any, requestedById: string) {
    const moneyOut = new MoneyOut({
      ...data,
      requestedById,
      approvalStatus: 'PENDING_APPROVAL'
    });
    
    await moneyOut.save();
    
    // Audit log
    await AuditLog.create({
      userId: requestedById,
      action: 'CREATE_MONEY_OUT',
      resourceType: 'MoneyOut',
      resourceId: moneyOut._id,
      details: {
        category: moneyOut.category,
        amount: moneyOut.amount,
        beneficiary: moneyOut.beneficiaryName
      }
    });
    
    return moneyOut;
  }
  
  // ========================================
  // GET ALL MONEY OUT (WITH FILTERS)
  // ========================================
  async getAllMoneyOut(filters: {
    category?: string;
    approvalStatus?: string;
    startDate?: string;
    endDate?: string;
    requestedById?: string;
    search?: string;
  }) {
    const query: any = { isDeleted: false };
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.approvalStatus) {
      query.approvalStatus = filters.approvalStatus;
    }
    
    if (filters.startDate || filters.endDate) {
      query.paymentDate = {};
      if (filters.startDate) {
        query.paymentDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.paymentDate.$lte = new Date(filters.endDate);
      }
    }
    
    if (filters.requestedById) {
      query.requestedById = filters.requestedById;
    }
    
    if (filters.search) {
      query.$or = [
        { purpose: { $regex: filters.search, $options: 'i' } },
        { beneficiaryName: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const moneyOuts = await MoneyOut.find(query)
      .populate('requestedById', 'firstName lastName email')
      .populate('approvedById', 'firstName lastName')
      .populate('rejectedById', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    return moneyOuts;
  }
  
  // ========================================
  // GET SINGLE MONEY OUT
  // ========================================
  async getMoneyOutById(id: string) {
    const moneyOut = await MoneyOut.findOne({ _id: id, isDeleted: false })
      .populate('requestedById', 'firstName lastName email role')
      .populate('approvedById', 'firstName lastName')
      .populate('rejectedById', 'firstName lastName')
      .populate('deletedById', 'firstName lastName')
      .populate('editHistory.editedById', 'firstName lastName');
    
    if (!moneyOut) {
      throw new Error('Money Out record not found');
    }
    
    return moneyOut;
  }
  
  // ========================================
  // UPDATE MONEY OUT (ONLY IF PENDING)
  // ========================================
  async updateMoneyOut(id: string, updates: any, userId: string, reason: string) {
    const moneyOut = await MoneyOut.findOne({ _id: id, isDeleted: false });
    
    if (!moneyOut) {
      throw new Error('Money Out record not found');
    }
    
    if (moneyOut.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error('Cannot edit: Already approved/rejected/paid');
    }
    
    // Track edit history
    const editHistory: any = {
      editedAt: new Date(),
      editedById: userId,
      reason
    };
    
    if (updates.amount && updates.amount !== moneyOut.amount) {
      editHistory.previousAmount = moneyOut.amount;
      editHistory.newAmount = updates.amount;
    }
    
    if (updates.category && updates.category !== moneyOut.category) {
      editHistory.previousCategory = moneyOut.category;
      editHistory.newCategory = updates.category;
    }
    
    if (updates.purpose && updates.purpose !== moneyOut.purpose) {
      editHistory.previousPurpose = moneyOut.purpose;
      editHistory.newPurpose = updates.purpose;
    }
    
    moneyOut.editHistory.push(editHistory);
    
    // Apply updates
    Object.assign(moneyOut, updates);
    await moneyOut.save();
    
    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE_MONEY_OUT',
      resourceType: 'MoneyOut',
      resourceId: moneyOut._id,
      details: { reason, updates }
    });
    
    return moneyOut;
  }
  
  // ========================================
  // APPROVE MONEY OUT (DIRECTOR ONLY)
  // ========================================
  async approveMoneyOut(id: string, directorId: string) {
    const moneyOut = await MoneyOut.findOne({ _id: id, isDeleted: false });
    
    if (!moneyOut) {
      throw new Error('Money Out record not found');
    }
    
    if (moneyOut.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error('Can only approve pending requests');
    }
    
    moneyOut.approvalStatus = 'APPROVED';
    moneyOut.approvedById = new mongoose.Types.ObjectId(directorId);
    moneyOut.approvedAt = new Date();
    
    await moneyOut.save();
    
    // Audit log
    await AuditLog.create({
      userId: directorId,
      action: 'APPROVE_MONEY_OUT',
      resourceType: 'MoneyOut',
      resourceId: moneyOut._id,
      details: {
        amount: moneyOut.amount,
        category: moneyOut.category,
        beneficiary: moneyOut.beneficiaryName
      }
    });
    
    return moneyOut;
  }
  
  // ========================================
  // REJECT MONEY OUT (DIRECTOR ONLY)
  // ========================================
  async rejectMoneyOut(id: string, directorId: string, rejectionReason: string) {
    const moneyOut = await MoneyOut.findOne({ _id: id, isDeleted: false });
    
    if (!moneyOut) {
      throw new Error('Money Out record not found');
    }
    
    if (moneyOut.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error('Can only reject pending requests');
    }
    
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }
    
    moneyOut.approvalStatus = 'REJECTED';
    moneyOut.rejectedById = new mongoose.Types.ObjectId(directorId);
    moneyOut.rejectedAt = new Date();
    moneyOut.rejectionReason = rejectionReason;
    
    await moneyOut.save();
    
    // Audit log
    await AuditLog.create({
      userId: directorId,
      action: 'REJECT_MONEY_OUT',
      resourceType: 'MoneyOut',
      resourceId: moneyOut._id,
      details: {
        reason: rejectionReason,
        amount: moneyOut.amount,
        category: moneyOut.category
      }
    });
    
    return moneyOut;
  }
  
  // ========================================
  // MARK AS PAID (DIRECTOR ONLY)
  // ========================================
  async markAsPaid(id: string, directorId: string, paymentProof: string) {
    const moneyOut = await MoneyOut.findOne({ _id: id, isDeleted: false });
    
    if (!moneyOut) {
      throw new Error('Money Out record not found');
    }
    
    if (moneyOut.approvalStatus !== 'APPROVED') {
      throw new Error('Can only mark approved requests as paid');
    }
    
    if (!paymentProof) {
      throw new Error('Payment proof is required');
    }
    
    moneyOut.approvalStatus = 'PAID';
    moneyOut.paidAt = new Date();
    moneyOut.paymentProof = paymentProof;
    
    await moneyOut.save();
    
    // Audit log
    await AuditLog.create({
      userId: directorId,
      action: 'MARK_MONEY_OUT_PAID',
      resourceType: 'MoneyOut',
      resourceId: moneyOut._id,
      details: {
        amount: moneyOut.amount,
        beneficiary: moneyOut.beneficiaryName
      }
    });
    
    return moneyOut;
  }
  
  // ========================================
  // SOFT DELETE (DIRECTOR ONLY)
  // ========================================
  async deleteMoneyOut(id: string, directorId: string, deletionReason: string) {
    const moneyOut = await MoneyOut.findById(id);
    
    if (!moneyOut) {
      throw new Error('Money Out record not found');
    }
    
    if (moneyOut.isDeleted) {
      throw new Error('Record already deleted');
    }
    
    if (!deletionReason || deletionReason.trim().length < 10) {
      throw new Error('Deletion reason must be at least 10 characters');
    }
    
    moneyOut.isDeleted = true;
    moneyOut.deletedAt = new Date();
    moneyOut.deletedById = new mongoose.Types.ObjectId(directorId);
    moneyOut.deletionReason = deletionReason;
    
    await moneyOut.save();
    
    // Audit log
    await AuditLog.create({
      userId: directorId,
      action: 'DELETE_MONEY_OUT',
      resourceType: 'MoneyOut',
      resourceId: moneyOut._id,
      details: {
        reason: deletionReason,
        amount: moneyOut.amount,
        category: moneyOut.category
      }
    });
    
    return moneyOut;
  }
  
  // ========================================
  // GET STATISTICS
  // ========================================
  async getMoneyOutStats(filters?: { startDate?: string; endDate?: string }) {
    const query: any = { isDeleted: false };
    
    if (filters?.startDate || filters?.endDate) {
      query.paymentDate = {};
      if (filters.startDate) {
        query.paymentDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.paymentDate.$lte = new Date(filters.endDate);
      }
    }
    
    const [
      totalRecords,
      pendingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      totalAmount,
      paidAmount,
      categoryBreakdown
    ] = await Promise.all([
      MoneyOut.countDocuments(query),
      MoneyOut.countDocuments({ ...query, approvalStatus: 'PENDING_APPROVAL' }),
      MoneyOut.countDocuments({ ...query, approvalStatus: 'APPROVED' }),
      MoneyOut.countDocuments({ ...query, approvalStatus: 'REJECTED' }),
      MoneyOut.countDocuments({ ...query, approvalStatus: 'PAID' }),
      MoneyOut.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      MoneyOut.aggregate([
        { $match: { ...query, approvalStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      MoneyOut.aggregate([
        { $match: query },
        { 
          $group: { 
            _id: '$category', 
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          } 
        },
        { $sort: { totalAmount: -1 } }
      ])
    ]);
    
    return {
      totalRecords,
      pendingApproval: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      paid: paidCount,
      totalAmount: totalAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      pendingAmount: (totalAmount[0]?.total || 0) - (paidAmount[0]?.total || 0),
      categoryBreakdown
    };
  }
  
  // ========================================
  // GET DAILY RECONCILIATION
  // ========================================
  async getDailyReconciliation(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const records = await MoneyOut.find({
      isDeleted: false,
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
      .populate('requestedById', 'firstName lastName')
      .populate('approvedById', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    const stats = {
      totalRecords: records.length,
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      paidRecords: records.filter(r => r.approvalStatus === 'PAID').length,
      paidAmount: records.filter(r => r.approvalStatus === 'PAID').reduce((sum, r) => sum + r.amount, 0),
      pendingRecords: records.filter(r => r.approvalStatus === 'PENDING_APPROVAL').length,
      approvedRecords: records.filter(r => r.approvalStatus === 'APPROVED').length
    };
    
    return { records, stats };
  }
  
  // ========================================
  // EXPORT TO CSV
  // ========================================
  async exportToCSV(filters: any) {
    const records = await this.getAllMoneyOut(filters);
    
    const csvRows = [
      'Date,Category,Amount,Purpose,Beneficiary,Payment Method,Status,Requested By,Approved By'
    ];
    
    for (const record of records) {
      const requestedBy = `${(record.requestedById as any).firstName} ${(record.requestedById as any).lastName}`;
      const approvedBy = record.approvedById 
        ? `${(record.approvedById as any).firstName} ${(record.approvedById as any).lastName}`
        : 'N/A';
      
      csvRows.push([
        new Date(record.paymentDate).toLocaleDateString(),
        record.category,
        record.amount,
        `"${record.purpose.replace(/"/g, '""')}"`,
        record.beneficiaryName,
        record.paymentMethod,
        record.approvalStatus,
        requestedBy,
        approvedBy
      ].join(','));
    }
    
    return csvRows.join('\n');
  }
}

export default new MoneyOutService();
