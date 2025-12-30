import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MapPin, Building2, Phone, User, FileText, ArrowLeft, Edit, 
  MapPinned, Calendar, CheckCircle, XCircle, Shield, TrendingUp 
} from 'lucide-react';
import axios from 'axios';
import { getApiBaseURL } from '../../../lib/api';

interface Location {
  _id: string;
  locationName: string;
  city: string;
  state: string;
  lga?: string;
  address: string;
  locationType: string;
  isActive: boolean;
  totalBits: number;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Bit {
  _id: string;
  bitName: string;
  bitCode: string;
  shiftType: string;
  numberOfOperators: number;
  isActive: boolean;
}

export const ManagerLocationDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [bits, setBits] = useState<Bit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationDetails();
    fetchLocationBits();
  }, [id]);

  const fetchLocationDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      const response = await axios.get(`${API_URL}/api/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocation(response.data.location);
    } catch (error) {
      console.error('Error fetching location details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationBits = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      const response = await axios.get(`${API_URL}/api/bits?locationId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBits(response.data.bits || []);
    } catch (error) {
      console.error('Error fetching location bits:', error);
    }
  };

  const getLocationTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      'DAY': 'Day',
      'NIGHT': 'Night',
      '24_HOURS': '24 Hours',
      'ROTATING': 'Rotating'
    };
    return labels[shift] || shift;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Location not found</h3>
          <button
            onClick={() => navigate('/manager/locations')}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Animation */}
        <div className="mb-6 animate-fadeIn">
          <button
            onClick={() => navigate('/manager/locations')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Locations
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{location.locationName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{location.city}, {location.state}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/manager/locations/${location._id}/edit`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Edit className="h-5 w-5" />
              Edit Location
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6 animate-slideInLeft">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
            location.isActive 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
          }`}>
            {location.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {location.isActive ? 'Active Location' : 'Inactive Location'}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bits</p>
                <p className="text-3xl font-bold text-gray-900">{location.totalBits}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Bits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {bits.filter(b => b.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Location Type</p>
                <p className="text-lg font-bold text-gray-900">{getLocationTypeLabel(location.locationType)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Information */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPinned className="h-6 w-6 text-purple-600" />
              Location Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Building2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Location Name</p>
                  <p className="text-base font-semibold text-gray-900">{location.locationName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="text-base font-medium text-gray-900">{location.address}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {location.city}, {location.state}
                    {location.lga && ` • ${location.lga}`}
                  </p>
                </div>
              </div>

              {location.contactPerson && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <User className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Contact Person</p>
                    <p className="text-base font-medium text-gray-900">{location.contactPerson}</p>
                  </div>
                </div>
              )}

              {location.contactPhone && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Phone className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Contact Phone</p>
                    <p className="text-base font-medium text-gray-900">{location.contactPhone}</p>
                  </div>
                </div>
              )}

              {location.notes && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-base text-gray-900">{location.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="text-base text-gray-900">
                    {new Date(location.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Bits */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-slideInRight" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-600" />
              Assigned Bits ({bits.length})
            </h2>
            
            {bits.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No security bits assigned to this location</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {bits.map((bit, index) => (
                  <div
                    key={bit._id}
                    className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    onClick={() => navigate(`/manager/bits/${bit._id}/details`)}
                    style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{bit.bitName}</h3>
                        <span className="text-xs text-gray-500 font-mono">{bit.bitCode}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        bit.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {bit.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {bit.numberOfOperators} Ops
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        {getShiftLabel(bit.shiftType)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a855f7;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
      `}</style>
    </div>
  );
};
