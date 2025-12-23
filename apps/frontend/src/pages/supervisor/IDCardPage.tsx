import { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  QrCode,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api, getImageUrl } from '../../lib/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

interface SupervisorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  employeeId?: string;
  role: string;
  supervisor?: {
    id: string;
    employeeId: string;
    supervisorType: string;
    regionAssigned?: string;
    startDate: string;
    salary: number;
  };
}

export default function IDCardPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<SupervisorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      
      const link = document.createElement('a');
      link.download = `ID-Card-${profile?.employeeId || 'supervisor'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('ID Card downloaded successfully');
    } catch (error) {
      console.error('Error generating ID card:', error);
      toast.error('Failed to download ID card');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  const photoUrl = getImageUrl(profile?.profilePhoto);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-green-600" />
            Employee ID Card
          </h1>
          <p className="text-gray-600 mt-1">Your official company identification card</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>

        {/* ID Card */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-[400px] bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-2xl shadow-2xl overflow-hidden print:shadow-none"
          >
            {/* Card Header */}
            <div className="bg-white/10 backdrop-blur px-6 py-4 text-center">
              <h2 className="text-white font-bold text-xl">JAVELIN SECURITY</h2>
              <p className="text-green-100 text-sm">Employee Identification Card</p>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Photo and Basic Info */}
              <div className="flex gap-4 mb-6">
                <div className="flex-shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${profile?.firstName} ${profile?.lastName}`}
                      className="w-24 h-28 object-cover rounded-lg border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-28 bg-white/20 rounded-lg border-2 border-white flex items-center justify-center">
                      <User className="w-12 h-12 text-white/60" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-white">
                  <h3 className="text-xl font-bold">
                    {profile?.firstName} {profile?.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="w-4 h-4 text-green-200" />
                    <span className="text-green-100 text-sm font-medium">
                      {profile?.supervisor?.supervisorType === 'GENERAL_SUPERVISOR' 
                        ? 'General Supervisor' 
                        : 'Supervisor'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-green-100 font-mono">
                      ID: {profile?.employeeId || profile?.supervisor?.employeeId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-white text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-200 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">Email</span>
                  </div>
                  <p className="truncate">{profile?.email}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-200 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs">Phone</span>
                  </div>
                  <p>{profile?.phone || 'N/A'}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 col-span-2">
                  <div className="flex items-center gap-2 text-green-200 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs">Region Assigned</span>
                  </div>
                  <p>{profile?.supervisor?.regionAssigned || 'Not assigned'}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 col-span-2">
                  <div className="flex items-center gap-2 text-green-200 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Start Date</span>
                  </div>
                  <p>
                    {profile?.supervisor?.startDate 
                      ? new Date(profile.supervisor.startDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-2 rounded-lg">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-green-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-white/10 backdrop-blur px-6 py-3 text-center">
              <p className="text-green-100 text-xs">
                This card is property of Javelin Security Services
              </p>
              <p className="text-green-200 text-xs mt-1">
                If found, please return to the nearest office
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">ID Card Guidelines</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              Always carry your ID card while on duty
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              Display your ID card visibly when entering company premises
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              Report lost or damaged cards immediately to your supervisor
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              Do not share or lend your ID card to anyone
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
