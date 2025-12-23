import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as locationService from '../services/location.service';

const router = Router();

router.use(authenticate);

// City autocomplete
router.get(
  '/cities/search',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { q } = req.query;
    const cities = await locationService.searchCities(q as string);
    res.json({ cities });
  })
);

// Create location (Secretary only)
router.post(
  '/',
  requireRole(['SECRETARY', 'DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const location = await locationService.createLocation({
      ...req.body,
      createdById: userId,
    });
    res.status(201).json({ location });
  })
);

// Get all locations
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { city, state, isActive, search, page, limit } = req.query;
    
    // Build filters object, only including defined values
    const filters: any = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    };
    
    // Only add filters that have values
    if (city) filters.city = city as string;
    if (state) filters.state = state as string;
    if (search) filters.search = search as string;
    
    // Only add isActive filter if it's explicitly 'true' or 'false', not 'all'
    if (isActive === 'true') {
      filters.isActive = true;
    } else if (isActive === 'false') {
      filters.isActive = false;
    }
    // If isActive is 'all' or undefined, don't filter by status
    
    console.log('Location filters:', filters);
    const result = await locationService.getAllLocations(filters);
    console.log('Found locations:', result.locations.length);
    res.json(result);
  })
);

// Get location statistics
router.get(
  '/stats',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await locationService.getLocationStats();
    res.json(stats);
  })
);

// Get location by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const location = await locationService.getLocationById(req.params.id);
    res.json({ location });
  })
);

// Update location
router.put(
  '/:id',
  requireRole(['SECRETARY', 'DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const location = await locationService.updateLocation(req.params.id, req.body);
    res.json({ location });
  })
);

// Delete location
router.delete(
  '/:id',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await locationService.deleteLocation(req.params.id);
    res.json({ message: 'Location deleted successfully' });
  })
);

export default router;
