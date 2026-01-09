import { Beat, Location, Operator, Supervisor } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

// Generate bit code with uniqueness guarantee
async function generateUniqueBitCode(locationName: string, locationId: string): Promise<string> {
  const prefix = locationName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3);
  
  // Find all existing bit codes for this location to get the highest number
  const existingBits = await Beat.find({ locationId })
    .select('beatCode')
    .sort({ beatCode: -1 })
    .lean();
  
  let maxNumber = 0;
  const pattern = new RegExp(`^BEAT-${prefix}-(\\d+)$`);
  
  for (const bit of existingBits) {
    const match = bit.beatCode.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  
  // Generate new code with next number
  const nextNumber = maxNumber + 1;
  const code = `BEAT-${prefix}-${String(nextNumber).padStart(3, '0')}`;
  
  // Double-check uniqueness (race condition protection)
  const exists = await Beat.findOne({ beatCode: code });
  if (exists) {
    // If somehow it exists, try with a timestamp suffix
    const timestamp = Date.now().toString().slice(-4);
    return `BEAT-${prefix}-${String(nextNumber).padStart(3, '0')}-${timestamp}`;
  }
  
  return code;
}

// Create bit
interface CreateBitData {
  beatName: string;
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
    logger.info('Creating new bit', { beatName: data.beatName });

    // Verify location exists
    const location = await Location.findById(data.locationId);
    if (!location) {
      throw new AppError('Location not found', 404);
    }

    // Generate unique bit code
    const beatCode = await generateUniqueBitCode(location.locationName, data.locationId);

    const bit = await Beat.create({
      ...data,
      beatCode,
    });

    // Update location total beats count
    await Location.findByIdAndUpdate(data.locationId, {
      $inc: { totalBits: 1 },
    });

    logger.info('Beat created successfully', { beatId: bit._id, beatCode });
    return bit;
  } catch (error: any) {
    logger.error('Error creating bit:', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to create bit', 500);
  }
}

// Get all beats
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
      { beatName: { $regex: search, $options: 'i' } },
      { beatCode: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [beats, total] = await Promise.all([
    Beat.find(filter)
      .populate('locationId', 'locationName city state address')
      .populate('clientId', 'clientName companyName')
      .populate('supervisorId')
      .populate('createdById', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Beat.countDocuments(filter),
  ]);

  return {
    beats,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get all beats with full details (location, supervisor, operators)
export async function getAllBitsWithDetails(options?: {
  includeOperators?: boolean;
  includeSupervisor?: boolean;
  includeLocation?: boolean;
}) {
  try {
    const { includeOperators = false, includeSupervisor = false, includeLocation = false } = options || {};

    let query = Beat.find({ isActive: true }).sort({ createdAt: -1 });

    // Populate location if requested
    if (includeLocation) {
      query = query.populate('locationId', 'locationName city state address contactPerson contactPhone');
    }

    // Populate supervisor if requested
    if (includeSupervisor) {
      query = query.populate({
        path: 'supervisorId',
        select: 'userId employeeId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone passportPhoto',
        },
      });
    }

    const beats = await query.lean();

    // If operators are requested, fetch them separately for each bit's location
    if (includeOperators && beats.length > 0) {
      const bitsWithOperators = await Promise.all(
        beats.map(async (bit: any) => {
          if (bit.locationId?._id) {
            const operators = await Operator.find({
              locationId: bit.locationId._id,
            })
              .populate('userId', 'firstName lastName email phone passportPhoto isActive')
              .select('employeeId userId')
              .lean();

            // Transform location to match frontend expectations (name instead of locationName)
            const transformedBit = {
              ...bit,
              beatId: bit.beatCode,
              name: bit.beatName,
              locationId: bit.locationId ? {
                _id: bit.locationId._id,
                name: bit.locationId.locationName,
                address: bit.locationId.address,
                city: bit.locationId.city,
                state: bit.locationId.state,
                contactPerson: bit.locationId.contactPerson,
                contactPhone: bit.locationId.contactPhone,
              } : null,
              operators: operators.map((op: any) => ({
                _id: op._id,
                employeeId: op.employeeId,
                userId: {
                  firstName: op.userId?.firstName,
                  lastName: op.userId?.lastName,
                  email: op.userId?.email,
                  phone: op.userId?.phone,
                  passportPhoto: op.userId?.passportPhoto,
                },
                isActive: op.userId?.isActive,
              })),
            };
            return transformedBit;
          }
          // Transform even if no operators
          return {
            ...bit,
            beatId: bit.beatCode,
            name: bit.beatName,
            locationId: bit.locationId ? {
              _id: bit.locationId._id,
              name: bit.locationId.locationName,
              address: bit.locationId.address,
              city: bit.locationId.city,
              state: bit.locationId.state,
              contactPerson: bit.locationId.contactPerson,
              contactPhone: bit.locationId.contactPhone,
            } : null,
            operators: [],
          };
        })
      );
      return bitsWithOperators;
    }

    // Transform beats even without operators
    const transformedBits = beats.map((bit: any) => ({
      ...bit,
      beatId: bit.beatCode,
      name: bit.beatName,
      locationId: bit.locationId ? {
        _id: bit.locationId._id,
        name: bit.locationId.locationName,
        address: bit.locationId.address,
        city: bit.locationId.city,
        state: bit.locationId.state,
        contactPerson: bit.locationId.contactPerson,
        contactPhone: bit.locationId.contactPhone,
      } : null,
    }));

    return transformedBits;
  } catch (error: any) {
    logger.error('Error getting beats with details:', error);
    throw new AppError(error.message || 'Failed to get beats', 500);
  }
}

// Get bit by ID
export async function getBitById(beatId: string) {
  const bit = await Beat.findById(beatId)
    .populate('locationId')
    .populate('clientId')
    .populate('supervisorId')
    .populate('createdById', 'firstName lastName email')
    .lean();

  if (!bit) {
    throw new AppError('Beat not found', 404);
  }

  return bit;
}

// Update bit
export async function updateBit(beatId: string, updates: Partial<CreateBitData>) {
  const bit = await Beat.findByIdAndUpdate(
    beatId,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('locationId')
    .populate('clientId')
    .lean();

  if (!bit) {
    throw new AppError('Beat not found', 404);
  }

  logger.info('Beat updated', { beatId });
  return bit;
}

// Delete bit
export async function deleteBit(beatId: string) {
  const bit = await Beat.findById(beatId);
  
  if (!bit) {
    throw new AppError('Beat not found', 404);
  }

  await Beat.findByIdAndDelete(beatId);

  // Update location total beats count
  await Location.findByIdAndUpdate(bit.locationId, {
    $inc: { totalBits: -1 },
  });

  logger.info('Beat deleted', { beatId });
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
    Beat.countDocuments(),
    Beat.countDocuments({ isActive: true }),
    Beat.aggregate([
      { $group: { _id: '$shiftType', count: { $sum: 1 } } },
    ]),
    Beat.aggregate([
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
