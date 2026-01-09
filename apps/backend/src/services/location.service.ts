import { Location, Beat } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

// Nigerian cities database for autocomplete
const NIGERIAN_CITIES = [
  // Rivers State
  { name: 'Port Harcourt', state: 'Rivers', aliases: ['port', 'ph', 'portharcourt', 'phc'] },
  { name: 'Obio-Akpor', state: 'Rivers', aliases: ['obio', 'akpor'] },
  { name: 'Eleme', state: 'Rivers', aliases: ['eleme'] },
  { name: 'Okrika', state: 'Rivers', aliases: ['okrika'] },
  { name: 'Bonny', state: 'Rivers', aliases: ['bonny'] },
  
  // Lagos State
  { name: 'Lagos', state: 'Lagos', aliases: ['lagos', 'lag', 'eko'] },
  { name: 'Ikeja', state: 'Lagos', aliases: ['ikeja'] },
  { name: 'Lekki', state: 'Lagos', aliases: ['lekki'] },
  { name: 'Victoria Island', state: 'Lagos', aliases: ['vi', 'victoria'] },
  { name: 'Ikorodu', state: 'Lagos', aliases: ['ikorodu'] },
  { name: 'Epe', state: 'Lagos', aliases: ['epe'] },
  { name: 'Badagry', state: 'Lagos', aliases: ['badagry'] },
  
  // FCT Abuja
  { name: 'Abuja', state: 'FCT', aliases: ['abuja', 'fct', 'aso'] },
  { name: 'Gwagwalada', state: 'FCT', aliases: ['gwagwa'] },
  { name: 'Kuje', state: 'FCT', aliases: ['kuje'] },
  { name: 'Bwari', state: 'FCT', aliases: ['bwari'] },
  
  // Kano State
  { name: 'Kano', state: 'Kano', aliases: ['kano'] },
  { name: 'Wudil', state: 'Kano', aliases: ['wudil'] },
  { name: 'Gwarzo', state: 'Kano', aliases: ['gwarzo'] },
  
  // Oyo State
  { name: 'Ibadan', state: 'Oyo', aliases: ['ibadan', 'ib'] },
  { name: 'Ogbomosho', state: 'Oyo', aliases: ['ogbomosho'] },
  { name: 'Oyo', state: 'Oyo', aliases: ['oyo'] },
  
  // Kaduna State
  { name: 'Kaduna', state: 'Kaduna', aliases: ['kaduna', 'kad'] },
  { name: 'Zaria', state: 'Kaduna', aliases: ['zaria'] },
  { name: 'Kafanchan', state: 'Kaduna', aliases: ['kafanchan'] },
  
  // Edo State
  { name: 'Benin City', state: 'Edo', aliases: ['benin', 'benin city'] },
  { name: 'Auchi', state: 'Edo', aliases: ['auchi'] },
  
  // Cross River State
  { name: 'Calabar', state: 'Cross River', aliases: ['calabar', 'cal'] },
  { name: 'Ugep', state: 'Cross River', aliases: ['ugep'] },
  
  // Delta State
  { name: 'Warri', state: 'Delta', aliases: ['warri'] },
  { name: 'Asaba', state: 'Delta', aliases: ['asaba'] },
  { name: 'Sapele', state: 'Delta', aliases: ['sapele'] },
  { name: 'Ughelli', state: 'Delta', aliases: ['ughelli'] },
  
  // Enugu State
  { name: 'Enugu', state: 'Enugu', aliases: ['enugu'] },
  { name: 'Nsukka', state: 'Enugu', aliases: ['nsukka'] },
  
  // Abia State
  { name: 'Aba', state: 'Abia', aliases: ['aba'] },
  { name: 'Umuahia', state: 'Abia', aliases: ['umuahia'] },
  
  // Anambra State
  { name: 'Onitsha', state: 'Anambra', aliases: ['onitsha'] },
  { name: 'Awka', state: 'Anambra', aliases: ['awka'] },
  { name: 'Nnewi', state: 'Anambra', aliases: ['nnewi'] },
  
  // Plateau State
  { name: 'Jos', state: 'Plateau', aliases: ['jos'] },
  { name: 'Bukuru', state: 'Plateau', aliases: ['bukuru'] },
  
  // Kwara State
  { name: 'Ilorin', state: 'Kwara', aliases: ['ilorin'] },
  { name: 'Offa', state: 'Kwara', aliases: ['offa'] },
  
  // Ogun State
  { name: 'Abeokuta', state: 'Ogun', aliases: ['abeokuta'] },
  { name: 'Ijebu Ode', state: 'Ogun', aliases: ['ijebu', 'ijebu ode'] },
  { name: 'Sagamu', state: 'Ogun', aliases: ['sagamu', 'shagamu'] },
  
  // Ondo State
  { name: 'Akure', state: 'Ondo', aliases: ['akure'] },
  { name: 'Ondo', state: 'Ondo', aliases: ['ondo'] },
  { name: 'Owo', state: 'Ondo', aliases: ['owo'] },
  
  // Akwa Ibom State
  { name: 'Uyo', state: 'Akwa Ibom', aliases: ['uyo'] },
  { name: 'Ikot Ekpene', state: 'Akwa Ibom', aliases: ['ikot ekpene'] },
  { name: 'Eket', state: 'Akwa Ibom', aliases: ['eket'] },
  
  // Bayelsa State
  { name: 'Yenagoa', state: 'Bayelsa', aliases: ['yenagoa'] },
  { name: 'Brass', state: 'Bayelsa', aliases: ['brass'] },
  
  // Benue State
  { name: 'Makurdi', state: 'Benue', aliases: ['makurdi'] },
  { name: 'Gboko', state: 'Benue', aliases: ['gboko'] },
  
  // Borno State
  { name: 'Maiduguri', state: 'Borno', aliases: ['maiduguri'] },
  { name: 'Bama', state: 'Borno', aliases: ['bama'] },
  
  // Imo State
  { name: 'Owerri', state: 'Imo', aliases: ['owerri'] },
  { name: 'Orlu', state: 'Imo', aliases: ['orlu'] },
  
  // Niger State
  { name: 'Minna', state: 'Niger', aliases: ['minna'] },
  { name: 'Suleja', state: 'Niger', aliases: ['suleja'] },
  
  // Osun State
  { name: 'Osogbo', state: 'Osun', aliases: ['osogbo'] },
  { name: 'Ile-Ife', state: 'Osun', aliases: ['ife', 'ile-ife'] },
  
  // Sokoto State
  { name: 'Sokoto', state: 'Sokoto', aliases: ['sokoto'] },
  
  // Taraba State
  { name: 'Jalingo', state: 'Taraba', aliases: ['jalingo'] },
  
  // Zamfara State
  { name: 'Gusau', state: 'Zamfara', aliases: ['gusau'] },
  
  // Bauchi State
  { name: 'Bauchi', state: 'Bauchi', aliases: ['bauchi'] },
  
  // Gombe State
  { name: 'Gombe', state: 'Gombe', aliases: ['gombe'] },
  
  // Ekiti State
  { name: 'Ado-Ekiti', state: 'Ekiti', aliases: ['ado', 'ekiti', 'ado-ekiti'] },
  
  // Ebonyi State
  { name: 'Abakaliki', state: 'Ebonyi', aliases: ['abakaliki'] },
  
  // Adamawa State
  { name: 'Yola', state: 'Adamawa', aliases: ['yola'] },
  
  // Jigawa State
  { name: 'Dutse', state: 'Jigawa', aliases: ['dutse'] },
  
  // Kebbi State
  { name: 'Birnin Kebbi', state: 'Kebbi', aliases: ['birnin', 'kebbi'] },
  
  // Kogi State
  { name: 'Lokoja', state: 'Kogi', aliases: ['lokoja'] },
  
  // Nasarawa State
  { name: 'Lafia', state: 'Nasarawa', aliases: ['lafia'] },
  { name: 'Keffi', state: 'Nasarawa', aliases: ['keffi'] },
  
  // Yobe State
  { name: 'Damaturu', state: 'Yobe', aliases: ['damaturu'] },
];

// Autocomplete city search
export async function searchCities(query: string) {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const matches = NIGERIAN_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchTerm) ||
    city.aliases.some(alias => alias.includes(searchTerm))
  );

  return matches.slice(0, 10).map(city => ({
    name: city.name,
    state: city.state,
    fullName: `${city.name}, ${city.state}`,
  }));
}

// Create location
interface CreateLocationData {
  locationName: string;
  city: string;
  state: string;
  lga?: string;
  address: string;
  coordinates?: { latitude: number; longitude: number };
  locationType?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  createdById: string;
}

export async function createLocation(data: CreateLocationData) {
  try {
    logger.info('Creating new location', { locationName: data.locationName });

    const location = await Location.create(data);

    logger.info('Location created successfully', { locationId: location._id });
    return location;
  } catch (error: any) {
    logger.error('Error creating location:', error);
    throw new AppError(error.message || 'Failed to create location', 500);
  }
}

// Get all locations
export async function getAllLocations(filters?: {
  city?: string;
  state?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { city, state, isActive, search, page = 1, limit = 50 } = filters || {};

  const filter: any = {};

  if (city) filter.city = city;
  if (state) filter.state = state;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { locationName: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { state: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [locations, total] = await Promise.all([
    Location.find(filter)
      .populate('createdById', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Location.countDocuments(filter),
  ]);

  return {
    locations,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get location by ID
export async function getLocationById(locationId: string) {
  const location = await Location.findById(locationId)
    .populate('createdById', 'firstName lastName email')
    .lean();

  if (!location) {
    throw new AppError('Location not found', 404);
  }

  // Get beats for this location
  const beats = await Beat.find({ locationId })
    .populate('supervisorId')
    .lean();

  return {
    ...location,
    beats,
  };
}

// Update location
export async function updateLocation(locationId: string, updates: Partial<CreateLocationData>) {
  const location = await Location.findByIdAndUpdate(
    locationId,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean();

  if (!location) {
    throw new AppError('Location not found', 404);
  }

  logger.info('Location updated', { locationId });
  return location;
}

// Delete location
export async function deleteLocation(locationId: string) {
  // Check if location has active beats
  const activeBits = await Beat.countDocuments({ locationId, isActive: true });
  
  if (activeBits > 0) {
    throw new AppError('Cannot delete location with active beats', 400);
  }

  await Location.findByIdAndDelete(locationId);
  
  logger.info('Location deleted', { locationId });
  return { success: true };
}

// Get location statistics
export async function getLocationStats() {
  const [
    totalLocations,
    activeLocations,
    totalBits,
    locationsByState,
  ] = await Promise.all([
    Location.countDocuments(),
    Location.countDocuments({ isActive: true }),
    Beat.countDocuments({ isActive: true }),
    Location.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    total: totalLocations,
    active: activeLocations,
    totalBits,
    byState: locationsByState.map((item: any) => ({
      state: item._id,
      count: item.count,
    })),
  };
}
