import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Report from '../models/Report';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 File validation:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
    
    // Allow images, audio, and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp3|wav|m4a|ogg|webm|mpeg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    // Accept if either extension OR mimetype matches (more lenient)
    if (extname || mimetype) {
      console.log('✅ File accepted');
      return cb(null, true);
    } else {
      console.log('❌ File rejected:', { extname, mimetype });
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images, audio, and documents allowed.`));
    }
  },
});

// Get all reports (with filters)
router.get('/', authenticate, asyncHandler(async (req: any, res) => {
  const { role, userId } = req.user;
  const { type, status, bitId, locationId, supervisorId, dateFrom, dateTo, search } = req.query;
  
  let query: any = {};
  
  // Role-based filtering
  if (role === 'SUPERVISOR') {
    const Supervisor = req.app.get('mongoose').model('Supervisor');
    const supervisor = await Supervisor.findOne({ userId }).lean();
    if (supervisor) {
      query.supervisorId = supervisor._id;
    }
  } else if (role === 'GENERAL_SUPERVISOR') {
    const GeneralSupervisor = req.app.get('mongoose').model('GeneralSupervisor');
    const Supervisor = req.app.get('mongoose').model('Supervisor');
    const gs = await GeneralSupervisor.findOne({ userId }).lean();
    if (gs) {
      const supervisors = await Supervisor.find({ generalSupervisorId: gs._id }).lean();
      const supervisorIds = [...supervisors.map((s: any) => s._id), gs._id];
      query.supervisorId = { $in: supervisorIds };
    }
  }
  
  // Apply filters
  if (type) query.reportType = type;
  if (status) query.status = status;
  if (bitId) query.bitId = bitId;
  if (locationId) query.locationId = locationId;
  if (supervisorId) query.supervisorId = supervisorId;
  
  // Date range filter
  if (dateFrom || dateTo) {
    query.occurrenceDate = {};
    if (dateFrom) query.occurrenceDate.$gte = new Date(dateFrom);
    if (dateTo) query.occurrenceDate.$lte = new Date(dateTo);
  }
  
  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  const reports = await Report.find(query)
    .populate({
      path: 'supervisorId',
      populate: { path: 'userId', select: 'firstName lastName email' }
    })
    .populate('bitId', 'bitName bitCode')
    .populate('locationId', 'locationName city state')
    .populate('createdBy', 'firstName lastName')
    .sort({ occurrenceDate: -1, createdAt: -1 })
    .lean();
  
  // Add convenience flags
  const reportsWithFlags = reports.map((report: any) => ({
    ...report,
    hasImages: report.images && report.images.length > 0,
    hasAudio: report.audioRecordings && report.audioRecordings.length > 0,
    hasFiles: report.attachedFiles && report.attachedFiles.length > 0,
  }));
  
  res.json({
    success: true,
    count: reportsWithFlags.length,
    reports: reportsWithFlags,
  });
}));

// Get single report
router.get('/:id', authenticate, asyncHandler(async (req: any, res) => {
  const report = await Report.findById(req.params.id)
    .populate({
      path: 'supervisorId',
      populate: { path: 'userId', select: 'firstName lastName email phone' }
    })
    .populate('bitId', 'bitName bitCode')
    .populate('locationId', 'locationName address city state')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .populate({
      path: 'auditLog.performedBy',
      select: 'firstName lastName email'
    });
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  // Add audit log entry for viewing
  await report.addAuditLog('VIEWED', req.user.userId, undefined, req.ip);
  
  res.json({
    success: true,
    report,
  });
}));

// Debug middleware for POST /
router.post('/', (req, res, next) => {
  console.log('🔍 POST / reports - Request received');
  console.log('📦 Content-Type:', req.headers['content-type']);
  console.log('👤 Has authorization:', !!req.headers.authorization);
  next();
}, authenticate, (req: any, res, next) => {
  console.log('✅ Authentication passed');
  console.log('👤 User:', req.user);
  next();
}, authorize('DIRECTOR', 'GENERAL_SUPERVISOR', 'SUPERVISOR'), (req, res, next) => {
  console.log('✅ Authorization passed');
  next();
}, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audio', maxCount: 5 },
  { name: 'files', maxCount: 5 }
]), (req, res, next) => {
  console.log('✅ Upload middleware passed');
  next();
}, asyncHandler(async (req: any, res) => {
  console.log('✅ Reached handler');
  const {
    title,
    reportType,
    bitId,
    locationId,
    supervisorId,
    occurrenceDate,
    occurrenceTime,
    description,
    chronologicalNarrative,
    priority,
    tags,
    status,
  } = req.body;
  
  // Process uploaded files
  const images = req.files?.images?.map((file: any) => ({
    url: `/uploads/reports/${file.filename}`,
    filename: file.originalname,
    uploadedAt: new Date(),
  })) || [];
  
  const audioRecordings = req.files?.audio?.map((file: any) => ({
    url: `/uploads/reports/${file.filename}`,
    filename: file.originalname,
    uploadedAt: new Date(),
  })) || [];
  
  const attachedFiles = req.files?.files?.map((file: any) => ({
    url: `/uploads/reports/${file.filename}`,
    filename: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedAt: new Date(),
  })) || [];
  
  // Directors and Managers auto-approve their reports
  const isAutoApprove = req.user.role === 'DIRECTOR' || req.user.role === 'MANAGER';
  const reportStatus = status || 'DRAFT';
  const finalStatus = isAutoApprove && reportStatus !== 'DRAFT' ? 'APPROVED' : reportStatus;
  
  // Build audit log
  const auditLog: any[] = [{
    action: 'CREATED',
    performedBy: req.user.userId,
    performedAt: new Date(),
    ipAddress: req.ip,
  }];
  
  // If director or manager is submitting (not draft), auto-approve
  if (isAutoApprove && finalStatus === 'APPROVED') {
    auditLog.push({
      action: 'SUBMITTED',
      performedBy: req.user.userId,
      performedAt: new Date(),
      ipAddress: req.ip,
    });
    auditLog.push({
      action: 'APPROVED',
      performedBy: req.user.userId,
      performedAt: new Date(),
      ipAddress: req.ip,
      details: 'Auto-approved by Director/Manager',
    });
  }
  
  // Create report
  const report = await Report.create({
    title,
    reportType,
    bitId,
    locationId,
    supervisorId: supervisorId || req.supervisor?._id || req.generalSupervisor?._id,
    occurrenceDate,
    occurrenceTime,
    description,
    chronologicalNarrative,
    images,
    audioRecordings,
    attachedFiles,
    priority: priority || 'MEDIUM',
    tags: tags ? JSON.parse(tags) : [],
    status: finalStatus,
    createdBy: req.user.userId,
    submittedAt: isDirector && finalStatus === 'APPROVED' ? new Date() : undefined,
    submittedBy: isDirector && finalStatus === 'APPROVED' ? req.user.userId : undefined,
    approvedAt: isDirector && finalStatus === 'APPROVED' ? new Date() : undefined,
    approvedBy: isDirector && finalStatus === 'APPROVED' ? req.user.userId : undefined,
    auditLog,
  });
  
  const populatedReport = await Report.findById(report._id)
    .populate({
      path: 'supervisorId',
      populate: { path: 'userId', select: 'firstName lastName email phone' }
    })
    .populate('bitId', 'bitName bitCode')
    .populate('locationId', 'locationName address city state')
    .populate('createdBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .populate({
      path: 'auditLog.performedBy',
      select: 'firstName lastName email'
    });
  
  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    report: populatedReport,
  });
}));

// Update report
router.put('/:id', authenticate, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audio', maxCount: 5 },
  { name: 'files', maxCount: 5 }
]), asyncHandler(async (req: any, res) => {
  const report = await Report.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  // Check if user can edit
  if (!report.canEdit(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'This report is locked and cannot be edited. Only directors can modify approved reports.' 
    });
  }
  
  const {
    title,
    reportType,
    bitId,
    locationId,
    occurrenceDate,
    occurrenceTime,
    description,
    chronologicalNarrative,
    priority,
    tags,
  } = req.body;
  
  // Update fields
  if (title) report.title = title;
  if (reportType) report.reportType = reportType;
  if (bitId) report.bitId = bitId;
  if (locationId) report.locationId = locationId;
  if (occurrenceDate) report.occurrenceDate = occurrenceDate;
  if (occurrenceTime) report.occurrenceTime = occurrenceTime;
  if (description) report.description = description;
  if (chronologicalNarrative) report.chronologicalNarrative = chronologicalNarrative;
  if (priority) report.priority = priority;
  if (tags) report.tags = JSON.parse(tags);
  
  // Process new uploaded files
  if (req.files?.images) {
    const newImages = req.files.images.map((file: any) => ({
      url: `/uploads/reports/${file.filename}`,
      filename: file.originalname,
      uploadedAt: new Date(),
    }));
    report.images.push(...newImages);
  }
  
  if (req.files?.audio) {
    const newAudio = req.files.audio.map((file: any) => ({
      url: `/uploads/reports/${file.filename}`,
      filename: file.originalname,
      uploadedAt: new Date(),
    }));
    report.audioRecordings.push(...newAudio);
  }
  
  if (req.files?.files) {
    const newFiles = req.files.files.map((file: any) => ({
      url: `/uploads/reports/${file.filename}`,
      filename: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));
    report.attachedFiles.push(...newFiles);
  }
  
  report.updatedBy = req.user.userId;
  
  // Add audit log
  await report.addAuditLog('EDITED', req.user.userId, 'Report updated', req.ip);
  
  await report.save();
  
  const updatedReport = await Report.findById(report._id)
    .populate('supervisorId')
    .populate('bitId')
    .populate('locationId')
    .populate('createdBy')
    .populate('updatedBy');
  
  res.json({
    success: true,
    message: 'Report updated successfully',
    report: updatedReport,
  });
}));

// Submit report for review
router.post('/:id/submit', authenticate, asyncHandler(async (req: any, res) => {
  const report = await Report.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  if (report.status !== 'DRAFT' && report.status !== 'REVISION_REQUIRED') {
    return res.status(400).json({ success: false, message: 'Only draft or revision-required reports can be submitted' });
  }
  
  report.status = 'PENDING_REVIEW';
  report.submittedAt = new Date();
  report.submittedBy = req.user.userId;
  
  await report.addAuditLog('SUBMITTED', req.user.userId, 'Report submitted for review', req.ip);
  
  res.json({
    success: true,
    message: 'Report submitted for review',
    report,
  });
}));

// Approve report
router.post('/:id/approve', authenticate, authorize('DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR'), asyncHandler(async (req: any, res) => {
  const report = await Report.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  report.status = 'APPROVED';
  report.approvedAt = new Date();
  report.approvedBy = req.user.userId;
  report.reviewedAt = new Date();
  report.reviewedBy = req.user.userId;
  
  await report.addAuditLog('APPROVED', req.user.userId, 'Report approved', req.ip);
  
  res.json({
    success: true,
    message: 'Report approved successfully',
    report,
  });
}));

// Request revision
router.post('/:id/revision', authenticate, authorize('DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR'), asyncHandler(async (req: any, res) => {
  const { notes } = req.body;
  const report = await Report.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  report.status = 'REVISION_REQUIRED';
  report.revisionNotes = notes;
  report.reviewedAt = new Date();
  report.reviewedBy = req.user.userId;
  
  await report.addAuditLog('REVISION_REQUESTED', req.user.userId, notes, req.ip);
  
  res.json({
    success: true,
    message: 'Revision requested',
    report,
  });
}));

// Reject report
router.post('/:id/reject', authenticate, authorize('DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR'), asyncHandler(async (req: any, res) => {
  const { reason } = req.body;
  const report = await Report.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  report.status = 'REJECTED';
  report.rejectionReason = reason;
  report.reviewedAt = new Date();
  report.reviewedBy = req.user.userId;
  
  await report.addAuditLog('REJECTED', req.user.userId, reason, req.ip);
  
  res.json({
    success: true,
    message: 'Report rejected',
    report,
  });
}));

// Delete report (Directors only)
router.delete('/:id', authenticate, authorize('DIRECTOR'), asyncHandler(async (req: any, res) => {
  const report = await Report.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  // Delete associated files
  const deleteFile = (filePath: string) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  };
  
  report.images.forEach((img: any) => deleteFile(img.url));
  report.audioRecordings.forEach((audio: any) => deleteFile(audio.url));
  report.attachedFiles.forEach((file: any) => deleteFile(file.url));
  
  await report.deleteOne();
  
  res.json({
    success: true,
    message: 'Report deleted successfully',
  });
}));

// Export report as PDF
router.get('/:id/export', authenticate, asyncHandler(async (req: any, res) => {
  const report = await Report.findById(req.params.id)
    .populate('supervisorId')
    .populate('bitId')
    .populate('locationId')
    .populate('createdBy')
    .populate('approvedBy');
  
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  
  // Add audit log
  await report.addAuditLog('EXPORTED', req.user.userId, 'Report exported as PDF', req.ip);
  
  // For now, return JSON (PDF generation would require additional library like puppeteer or pdfkit)
  res.json({
    success: true,
    message: 'PDF export feature coming soon',
    report,
  });
}));

export default router;
