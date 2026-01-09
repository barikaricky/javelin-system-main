import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as bitService from '../services/bit.service';

const router = Router();

router.use(authenticate);

// Create bit (Secretary only)
router.post(
  '/',
  requireRole(['SECRETARY', 'DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const bit = await bitService.createBit({
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      createdById: userId,
    });
    res.status(201).json({ bit });
  })
);

// Get all beats
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { locationId, isActive, search, page, limit } = req.query;
    
    // Build filters object, only including defined values
    const filters: any = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    };
    
    // Only add filters that have values
    if (locationId) filters.locationId = locationId as string;
    if (search) filters.search = search as string;
    
    // Only add isActive filter if it's explicitly 'true' or 'false', not 'all'
    if (isActive === 'true') {
      filters.isActive = true;
    } else if (isActive === 'false') {
      filters.isActive = false;
    }
    // If isActive is 'all' or undefined, don't filter by status
    
    console.log('Beat filters:', filters);
    const result = await bitService.getAllBits(filters);
    console.log('Found beats:', result.beats?.length || 0);
    res.json(result);
  })
);

// Get bit statistics
router.get(
  '/stats',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await bitService.getBitStats();
    res.json(stats);
  })
);

// Get all beats with full details (MUST come before /:id)
router.get(
  '/all',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { includeOperators, includeSupervisor, includeLocation } = req.query;
    
    const options = {
      includeOperators: includeOperators === 'true',
      includeSupervisor: includeSupervisor === 'true',
      includeLocation: includeLocation === 'true',
    };
    
    const beats = await bitService.getAllBitsWithDetails(options);
    res.json(beats);
  })
);

// Get bit by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const bit = await bitService.getBitById(req.params.id);
    res.json({ bit });
  })
);

// Update bit
router.put(
  '/:id',
  requireRole(['SECRETARY', 'DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const updates = { ...req.body };
    if (req.body.startDate) updates.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updates.endDate = new Date(req.body.endDate);
    
    const bit = await bitService.updateBit(req.params.id, updates);
    res.json({ bit });
  })
);

// Delete bit
router.delete(
  '/:id',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await bitService.deleteBit(req.params.id);
    res.json({ message: 'Beat deleted successfully' });
  })
);

export default router;
