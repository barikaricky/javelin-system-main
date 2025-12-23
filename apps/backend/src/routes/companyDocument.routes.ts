import { Router, Response } from 'express';
import { AuthRequest, authenticate, authorize } from '../middlewares/auth.middleware';
import { companyDocumentService } from '../services/companyDocument.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG allowed'));
    }
  }
});

// Helper function to wrap async route handlers
const asyncHandler = (fn: Function) => (req: AuthRequest, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/documents - Upload new document
router.post(
  '/',
  authenticate,
  authorize('DIRECTOR', 'MANAGER', 'SECRETARY'),
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const {
      documentName,
      documentType,
      documentNumber,
      issuer,
      registrationDate,
      expiryDate,
      description,
    } = req.body;

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const document = await companyDocumentService.createDocument({
      documentName,
      documentType,
      documentNumber,
      issuer,
      registrationDate: new Date(registrationDate),
      expiryDate: new Date(expiryDate),
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      description,
      uploadedById: req.user!.userId,
    });

    res.status(201).json(document);
  })
);

// GET /api/documents - Get all documents with filters
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      documentType: req.query.documentType as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      isExpiringSoon: req.query.isExpiringSoon === 'true' ? true : undefined,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const result = await companyDocumentService.getAllDocuments(filters);
    res.json(result);
  })
);

// GET /api/documents/stats - Get document statistics
router.get(
  '/stats',
  authenticate,
  authorize('DIRECTOR', 'MANAGER', 'SECRETARY'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await companyDocumentService.getDocumentStats();
    res.json(stats);
  })
);

// GET /api/documents/expiring-soon - Get documents expiring soon
router.get(
  '/expiring-soon',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const documents = await companyDocumentService.getExpiringSoonDocuments();
    res.json(documents);
  })
);

// GET /api/documents/expired - Get expired documents
router.get(
  '/expired',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const documents = await companyDocumentService.getExpiredDocuments();
    res.json(documents);
  })
);

// GET /api/documents/types - Get document types
router.get(
  '/types',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const types = companyDocumentService.getDocumentTypes();
    res.json(types);
  })
);

// GET /api/documents/:id - Get document by ID
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const document = await companyDocumentService.getDocumentById(req.params.id);
    res.json(document);
  })
);

// PUT /api/documents/:id - Update document
router.put(
  '/:id',
  authenticate,
  authorize('DIRECTOR', 'MANAGER', 'SECRETARY'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      documentName,
      documentType,
      documentNumber,
      issuer,
      registrationDate,
      expiryDate,
      description,
      isActive,
    } = req.body;

    const updateData: any = {};
    if (documentName) updateData.documentName = documentName;
    if (documentType) updateData.documentType = documentType;
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber;
    if (issuer !== undefined) updateData.issuer = issuer;
    if (registrationDate) updateData.registrationDate = new Date(registrationDate);
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const document = await companyDocumentService.updateDocument(req.params.id, updateData);
    res.json(document);
  })
);

// DELETE /api/documents/:id - Delete document
router.delete(
  '/:id',
  authenticate,
  authorize('DIRECTOR'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await companyDocumentService.deleteDocument(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  })
);

// POST /api/documents/check-expiring - Manual check for expiring documents
router.post(
  '/check-expiring',
  authenticate,
  authorize('DIRECTOR'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await companyDocumentService.checkExpiringDocuments();
    res.json(result);
  })
);

export default router;
