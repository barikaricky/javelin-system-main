import { Bit, Location } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

// Generate bit code
function generateBitCode(locationName: string, index: number): string {
  const prefix = locationName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3);
  
  const code = `BIT-${prefix}-${String(index).padStart(3, '0')}`;
  return code;
}

// Create bit
interface CreateBitData {
  bitName: string;
  locationId: string;
  description?: string;
  clientId?: string;
  securityType: string[];
  numberOfOperators: number;
  shiftType: 'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING';
  startDate: Date;
  endDate?: Date;
  supervisorId?: string;
  specialInstructions?: string;
  createdById: string;
}

export async function createBit(data: CreateBitData) {
  try {
    logger.info('Creating new bit', { bitName: data.bitName });

    // Verify location exists
    const location = await Location.findById(data.locationId);
    if (!location) {
      throw new AppError('Location not found', 404);
    }

    // Generate unique bit code
    const bitsCount = await Bit.countDocuments({ locationId: data.locationId });
    const bitCode = generateBitCode(location.locationName, bitsCount + 1);

    const bit = await Bit.create({
      ...data,
      bitCode,
    });

    // Update location total bits count
    await Location.findByIdAndUpdate(data.locationId, {
      $inc: { totalBits: 1 },
    });

    logger.info('Bit created successfully', { bitId: bit._id, bitCode });
    return bit;
  } catch (error: any) {
    logger.error('Error creating bit:', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to create bit', 500);
  }
}

// Get all bits
export async function getAllBits(filters?: {
  locationId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { locationId, isActive, search, page = 1, limit = 50 } = filters || {};

  const filter: any = {};

  if (locationId) filter.locationId = locationId;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { bitName: { $regex: search, $options: 'i' } },
      { bitCode: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [bits, total] = await Promise.all([
    Bit.find(filter)
      .populate('locationId', 'locationName city state address')
      .populate('clientId', 'clientName companyName')
      .populate('supervisorId')
      .populate('createdById', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Bit.countDocuments(filter),
  ]);

  return {
    bits,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get bit by ID
export async function getBitById(bitId: string) {
  const bit = await Bit.findById(bitId)
    .populate('locationId')
    .populate('clientId')
    .populate('supervisorId')
    .populate('createdById', 'firstName lastName email')
    .lean();

  if (!bit) {
    throw new AppError('Bit not found', 404);
  }

  return bit;
}

// Update bit
export async function updateBit(bitId: string, updates: Partial<CreateBitData>) {
  const bit = await Bit.findByIdAndUpdate(
    bitId,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('locationId')
    .populate('clientId')
    .lean();

  if (!bit) {
    throw new AppError('Bit not found', 404);
  }

  logger.info('Bit updated', { bitId });
  return bit;
}

// Delete bit
export async function deleteBit(bitId: string) {
  const bit = await Bit.findById(bitId);
  
  if (!bit) {
    throw new AppError('Bit not found', 404);
  }

  await Bit.findByIdAndDelete(bitId);

  // Update location total bits count
  await Location.findByIdAndUpdate(bit.locationId, {
    $inc: { totalBits: -1 },
  });

  logger.info('Bit deleted', { bitId });
  return { success: true };
}

// Get bit statistics
export async function getBitStats() {
  const [
    totalBits,
    activeBits,
    bitsByShift,
    bitsByLocation,
  ] = await Promise.all([
    Bit.countDocuments(),
    Bit.countDocuments({ isActive: true }),
    Bit.aggregate([
      { $group: { _id: '$shiftType', count: { $sum: 1 } } },
    ]),
    Bit.aggregate([
      { $group: { _id: '$locationId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'location',
        },
      },
      { $unwind: '$location' },
    ]),
  ]);

  return {
    total: totalBits,
    active: activeBits,
    byShift: bitsByShift.map((item: any) => ({
      shiftType: item._id,
      count: item.count,
    })),
    topLocations: bitsByLocation.map((item: any) => ({
      locationName: item.location.locationName,
      count: item.count,
    })),
  };
}
