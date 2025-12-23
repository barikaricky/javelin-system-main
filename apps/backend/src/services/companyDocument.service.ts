import { CompanyDocument } from '../models/CompanyDocument.model';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';

interface CreateDocumentInput {
  documentName: string;
  documentType: string;
  documentNumber?: string;
  issuer?: string;
  registrationDate: Date;
  expiryDate: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  description?: string;
  uploadedById: string;
}

interface DocumentFilters {
  documentType?: string;
  isActive?: boolean;
  isExpiringSoon?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const companyDocumentService = {
  // Create new document
  async createDocument(data: CreateDocumentInput) {
    const document = await CompanyDocument.create(data);
    
    // Check if expiring soon and send notification
    if (document.isExpiringSoon && !document.notificationSent) {
      await this.sendExpiryNotification(document);
    }
    
    return await CompanyDocument.findById(document._id).populate('uploadedById', 'fullName email role');
  },

  // Get all documents with filters
  async getAllDocuments(filters: DocumentFilters = {}) {
    const {
      documentType,
      isActive,
      isExpiringSoon,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const query: any = {};

    if (documentType) query.documentType = documentType;
    if (isActive !== undefined) query.isActive = isActive;
    if (isExpiringSoon !== undefined) query.isExpiringSoon = isExpiringSoon;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      CompanyDocument.find(query)
        .populate('uploadedById', 'fullName email role')
        .sort({ expiryDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CompanyDocument.countDocuments(query),
    ]);

    return {
      documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // Get document by ID
  async getDocumentById(id: string) {
    const document = await CompanyDocument.findById(id).populate('uploadedById', 'fullName email role');
    if (!document) {
      throw new Error('Document not found');
    }
    return document;
  },

  // Update document
  async updateDocument(id: string, data: Partial<CreateDocumentInput>) {
    const document = await CompanyDocument.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('uploadedById', 'fullName email role');

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  },

  // Delete document
  async deleteDocument(id: string) {
    const document = await CompanyDocument.findByIdAndDelete(id);
    if (!document) {
      throw new Error('Document not found');
    }
    return { message: 'Document deleted successfully' };
  },

  // Get documents expiring soon
  async getExpiringSoonDocuments() {
    return await CompanyDocument.find({ isExpiringSoon: true, isActive: true })
      .populate('uploadedById', 'fullName email role')
      .sort({ expiryDate: 1 });
  },

  // Get expired documents
  async getExpiredDocuments() {
    return await CompanyDocument.find({
      expiryDate: { $lt: new Date() },
      isActive: false,
    })
      .populate('uploadedById', 'fullName email role')
      .sort({ expiryDate: -1 });
  },

  // Get statistics
  async getDocumentStats() {
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const [
      total,
      active,
      expired,
      expiringSoon,
      byType,
    ] = await Promise.all([
      CompanyDocument.countDocuments(),
      CompanyDocument.countDocuments({ isActive: true }),
      CompanyDocument.countDocuments({ expiryDate: { $lt: today } }),
      CompanyDocument.countDocuments({ 
        isExpiringSoon: true,
        isActive: true 
      }),
      CompanyDocument.aggregate([
        {
          $group: {
            _id: '$documentType',
            count: { $sum: 1 },
            expiringSoon: {
              $sum: { $cond: ['$isExpiringSoon', 1, 0] }
            },
          },
        },
      ]),
    ]);

    return {
      total,
      active,
      expired,
      expiringSoon,
      byType,
    };
  },

  // Send expiry notification
  async sendExpiryNotification(document: any) {
    try {
      // Get all Directors, Managers, and Secretaries
      const recipients = await User.find({
        role: { $in: ['DIRECTOR', 'MANAGER', 'SECRETARY'] },
        isActive: true,
      });

      const daysUntilExpiry = Math.ceil(
        (new Date(document.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create notifications for each recipient
      const notifications = recipients.map(user => ({
        userId: user._id,
        type: 'DOCUMENT_EXPIRY',
        title: `Document Expiring Soon: ${document.documentName}`,
        message: `The ${document.documentType.toLowerCase()} "${document.documentName}" will expire in ${daysUntilExpiry} days (${new Date(document.expiryDate).toLocaleDateString()}). Please renew it as soon as possible.`,
        priority: daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM',
        read: false,
      }));

      await Notification.insertMany(notifications);

      // Mark notification as sent
      document.notificationSent = true;
      await document.save();

      return { message: 'Notifications sent successfully' };
    } catch (error) {
      console.error('Error sending expiry notification:', error);
      throw error;
    }
  },

  // Check and notify for expiring documents (run daily via cron job)
  async checkExpiringDocuments() {
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    // Find documents expiring within 30 days that haven't been notified
    const expiringDocuments = await CompanyDocument.find({
      expiryDate: {
        $gte: today,
        $lte: oneMonthFromNow,
      },
      isActive: true,
      notificationSent: false,
    });

    // Send notifications for each
    for (const doc of expiringDocuments) {
      await this.sendExpiryNotification(doc);
    }

    return {
      message: `Checked ${expiringDocuments.length} expiring documents`,
      notified: expiringDocuments.length,
    };
  },

  // Get document types
  getDocumentTypes() {
    return ['LICENSE', 'PERMIT', 'CERTIFICATE', 'INSURANCE', 'CONTRACT', 'OTHER'];
  },
};
