import { useState, useRef } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Shield,
  QrCode
} from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employeeId: string;
  joinDate: string;
  address: string;
  profilePhoto: string | null;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  bloodGroup: string;
}

// Mock data
const mockProfile: UserProfile = {
  id: 'gs-001',
  firstName: 'Thomas',
  lastName: 'Anderson',
  email: 'thomas.anderson@company.com',
  phone: '+1 234 567 8900',
  role: 'General Supervisor',
  department: 'Security Operations',
  employeeId: 'EMP-GS-2024-001',
  joinDate: '2023-06-15',
  address: '456 Security Lane, City, State 12345',
  profilePhoto: null,
  emergencyContact: {
    name: 'Jane Anderson',
    phone: '+1 234 567 8999',
    relationship: 'Spouse'
  },
  bloodGroup: 'O+'
};

export default function IDCardPage() {
  const [profile] = useState<UserProfile>(mockProfile);
  const [cardStyle, setCardStyle] = useState<'standard' | 'modern'>('standard');
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('ID Card download feature coming soon!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ID Card</h1>
          <p className="text-gray-600">View and print your official ID card</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={cardStyle}
            onChange={(e) => setCardStyle(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="standard">Standard Style</option>
            <option value="modern">Modern Style</option>
          </select>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      </div>

      {/* ID Card Preview */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Card */}
        <div className="flex-1 flex justify-center">
          <div 
            ref={cardRef}
            className={`w-[400px] rounded-2xl overflow-hidden shadow-2xl print:shadow-none ${
              cardStyle === 'standard' ? 'bg-white' : 'bg-gradient-to-br from-blue-900 to-indigo-900'
            }`}
          >
            {cardStyle === 'standard' ? (
              // Standard Style
              <>
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Shield size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">JAVELIN SECURITY</p>
                      <p className="text-sm opacity-80">Security Management System</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      {profile.profilePhoto ? (
                        <img
                          src={profile.profilePhoto}
                          alt={`${profile.firstName} ${profile.lastName}`}
                          className="w-28 h-36 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-28 h-36 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-2 border-gray-200">
                          {profile.firstName[0]}{profile.lastName[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {profile.firstName} {profile.lastName}
                      </h2>
                      <p className="text-blue-600 font-semibold">{profile.role}</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <Building size={14} />
                          {profile.department}
                        </p>
                        <p className="flex items-center gap-2">
                          <CreditCard size={14} />
                          {profile.employeeId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Blood Group:</span>
                      <span className="ml-2 font-medium text-red-600">{profile.bloodGroup}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Valid Till:</span>
                      <span className="ml-2 font-medium">Dec 2025</span>
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="mt-4 flex justify-center">
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <div className="w-20 h-20 bg-white flex items-center justify-center">
                        <QrCode size={48} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-100 px-6 py-3 text-center">
                  <p className="text-xs text-gray-500">
                    If found, please return to Javelin Security HQ
                  </p>
                </div>
              </>
            ) : (
              // Modern Style
              <>
                {/* Modern Card */}
                <div className="relative p-6">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                  </div>

                  {/* Header */}
                  <div className="relative flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Shield size={24} className="text-white" />
                      <span className="text-white font-bold text-lg">JAVELIN</span>
                    </div>
                    <span className="text-white/60 text-sm">SECURITY ID</span>
                  </div>

                  {/* Photo & Info */}
                  <div className="relative flex gap-4">
                    {profile.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-24 h-28 rounded-lg object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-24 h-28 rounded-lg bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                        {profile.firstName[0]}{profile.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1 text-white">
                      <h2 className="text-xl font-bold mb-1">
                        {profile.firstName} {profile.lastName}
                      </h2>
                      <p className="text-blue-300 font-medium text-sm mb-3">{profile.role}</p>
                      <div className="space-y-1 text-sm text-white/80">
                        <p>{profile.department}</p>
                        <p>{profile.employeeId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="relative mt-6 flex items-center justify-between">
                    <div className="text-white/60 text-xs">
                      <p>Blood: <span className="text-white font-medium">{profile.bloodGroup}</span></p>
                      <p>Valid: <span className="text-white font-medium">12/2025</span></p>
                    </div>
                    <div className="p-2 bg-white rounded-lg">
                      <QrCode size={36} className="text-indigo-600" />
                    </div>
                  </div>
                </div>

                {/* Card Back Preview */}
                <div className="bg-white/10 p-4 text-center text-white/60 text-xs">
                  <p>Emergency Contact: {profile.emergencyContact.phone}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:w-96 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{profile.firstName} {profile.lastName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium text-gray-900">{profile.employeeId}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="font-medium text-gray-900">{new Date(profile.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{profile.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{profile.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{profile.emergencyContact.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Relationship</p>
                <p className="font-medium text-gray-900">{profile.emergencyContact.relationship}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Printing Instructions</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Use high-quality paper for best results</li>
              <li>• Recommended size: Credit card (3.375" x 2.125")</li>
              <li>• Enable background graphics for colors</li>
              <li>• Consider lamination for durability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card-print, #id-card-print * {
            visibility: visible;
          }
          #id-card-print {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}
