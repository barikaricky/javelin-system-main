import React, { useState, useEffect, useRef } from 'react';
import { Download, Eye, Printer, QrCode, User } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { api, getImageUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface StaffMember {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  role: string;
  department?: string;
  state?: string;
  lga?: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  passportPhoto?: string;
  status: string;
  createdAt: string;
  dateOfBirth?: string;
}

const ROLE_COLORS = {
  OPERATOR: { primary: '#3B82F6', secondary: '#3B82F6' }, // Blue
  SUPERVISOR: { primary: '#EAB308', secondary: '#EAB308' }, // Yellow
  GENERAL_SUPERVISOR: { primary: '#3B82F6', secondary: '#EAB308' }, // Blue + Yellow
  MANAGER: { primary: '#3B82F6', secondary: '#000000' }, // Blue + Black
  SECRETARY: { primary: '#3B82F6', secondary: '#3B82F6' }, // Blue
  DIRECTOR: { primary: '#000000', secondary: '#EAB308' }, // Black + Yellow accent
};

const ManagerIDCardGenerator: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set current logged-in user as the selected staff
    if (user) {
      console.log('👤 User data for ID card:', user);
      console.log('📝 Employee ID:', user.employeeId);
      console.log('📸 Profile Photo:', user.profilePhoto);
      console.log('📸 Passport Photo:', user.passportPhoto);
      console.log('🔗 Photo URL:', getImageUrl(user.profilePhoto || user.passportPhoto));
      console.log('🎂 Date of Birth:', user.dateOfBirth);
      setSelectedStaff(user as StaffMember);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStaff) {
      generateQRCode();
    }
  }, [selectedStaff]);



  const generateQRCode = async () => {
    if (!selectedStaff) return;

    // Generate verification URL - QR code will contain the verification page URL
    const verificationUrl = `${window.location.origin}/verify-id/${selectedStaff._id}`;
    console.log('🔗 QR Code Verification URL:', verificationUrl);

    try {
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
      console.log('✅ QR Code generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
    }
  };

  const getRoleColor = (role: string) => {
    return ROLE_COLORS[role as keyof typeof ROLE_COLORS] || ROLE_COLORS.OPERATOR;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getExpiryDate = (issueDate: string) => {
    const date = new Date(issueDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const downloadAsPDF = async () => {
    if (!cardRef.current) return;

    try {
      setLoading(true);
      
      // Get card elements
      const frontCard = cardRef.current.querySelector('.card-front') as HTMLElement;
      const backCard = cardRef.current.querySelector('.card-back') as HTMLElement;

      // Capture front side at high resolution
      const frontCanvas = await html2canvas(frontCard, {
        scale: 4,
        backgroundColor: null,
        logging: false,
        width: 322,
        height: 203
      });

      // Capture back side at high resolution
      const backCanvas = await html2canvas(backCard, {
        scale: 4,
        backgroundColor: null,
        logging: false,
        width: 322,
        height: 203
      });

      // Create PDF with exact CR80 dimensions (85.60 x 53.98 mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.60, 53.98]
      });

      // Add front side - fill entire page
      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.60, 53.98);
      
      // Add new page for back side
      pdf.addPage([85.60, 53.98], 'landscape');
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.60, 53.98);

      // Save PDF
      pdf.save(`ID-Card-${selectedStaff?.employeeId}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const printCard = () => {
    window.print();
  };

  if (!selectedStaff) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ID Card Generator</h1>
          <p className="text-sm text-gray-600 mt-1">Loading your ID card...</p>
        </div>
      </div>
    );
  }

  const roleColors = getRoleColor(selectedStaff.role);
  const serialNumber = `${selectedStaff.employeeId}-${Date.now().toString().slice(-6)}`;

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My ID Card</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {selectedStaff.firstName} {selectedStaff.lastName} - {selectedStaff.role}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={downloadAsPDF}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
          >
            <Download size={18} className="sm:w-5 sm:h-5" />
            <span>{loading ? 'Generating...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={printCard}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
          >
            <Printer size={18} className="sm:w-5 sm:h-5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Card Preview */}
      <div ref={cardRef} className="flex flex-col lg:flex-row gap-4 sm:gap-6 justify-center items-center">
        {/* Front Side */}
        <div className="w-full max-w-md lg:max-w-none flex justify-center">
        <div
          className="card-front"
          style={{
            width: '322px', // 85.60mm * 3.76 (px/mm at 96dpi)
            height: '203px', // 53.98mm * 3.76
            background: 'linear-gradient(180deg, #1E3A8A 0%, #000000 100%)',
            borderRadius: '11px',
            position: 'relative',
            fontFamily: "'Inter', 'Arial', sans-serif",
            overflow: 'hidden'
          }}
        >
          {/* Header Section */}
          <div style={{
            height: '45px',
            background: '#1E3A8A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              JAVELIN SECURITY
            </div>
          </div>

          {/* Yellow Separator */}
          <div style={{
            height: '3px',
            background: '#EAB308',
            width: '100%'
          }} />

          {/* Photo Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '8px',
            marginBottom: '6px'
          }}>
            <div style={{
              width: '80px',
              height: '100px',
              border: '3px solid #EAB308',
              borderRadius: '4px',
              overflow: 'hidden',
              background: '#E5E7EB',
              position: 'relative'
            }}>
              {/* Anti-copy pattern */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)',
                zIndex: 1
              }} />
              {selectedStaff.profilePhoto || selectedStaff.passportPhoto ? (
                <img 
                  src={getImageUrl(selectedStaff.profilePhoto || selectedStaff.passportPhoto)} 
                  alt="Staff"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'relative',
                    zIndex: 2
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  position: 'relative'
                }}>
                  <User size={45} color="#9CA3AF" />
                </div>
              )}
            </div>
          </div>

          {/* Staff Information */}
          <div style={{ padding: '0 10px', textAlign: 'center', marginTop: '4px' }}>
            {/* Full Name - Always visible */}
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              lineHeight: '1.1'
            }}>
              {selectedStaff.firstName} {selectedStaff.lastName}
            </div>
            
            {/* Employee ID */}
            <div style={{
              fontSize: '10px',
              color: '#EAB308',
              marginBottom: '3px',
              fontWeight: '700',
              letterSpacing: '0.3px'
            }}>
              ID: {selectedStaff.employeeId || selectedStaff.id || selectedStaff._id}
            </div>

            {/* Role */}
            <div style={{
              fontSize: '9px',
              color: '#EAB308',
              textTransform: 'uppercase',
              marginBottom: '2px',
              fontWeight: '600'
            }}>
              {selectedStaff.role.replace('_', ' ')}
            </div>

            {/* State/Location */}
            {selectedStaff.state && (
              <div style={{
                fontSize: '8px',
                color: '#FFFFFF',
                opacity: 0.9,
                marginBottom: '2px'
              }}>
                {selectedStaff.state}{selectedStaff.lga ? `, ${selectedStaff.lga}` : ''}
              </div>
            )}

            {/* Department */}
            {selectedStaff.department && (
              <div style={{
                fontSize: '8px',
                color: '#FFFFFF',
                opacity: 0.9
              }}>
                {selectedStaff.department}
              </div>
            )}
          </div>

          {/* Role Identifier Strip */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: '45px',
            width: '8px',
            height: '100px',
            background: roleColors.primary
          }} />

          {/* Validity Section */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '8px'
          }}>
            <div>
              <div style={{ color: '#FFFFFF', opacity: 0.8 }}>ISSUED</div>
              <div style={{ color: '#EAB308', fontWeight: '600' }}>{formatDate(selectedStaff.createdAt)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#FFFFFF', opacity: 0.8 }}>EXPIRES</div>
              <div style={{ color: '#EAB308', fontWeight: '600' }}>{getExpiryDate(selectedStaff.createdAt)}</div>
            </div>
          </div>
        </div>
        </div>

        {/* Back Side */}
        <div className="w-full max-w-md lg:max-w-none flex justify-center">
        <div
          className="card-back"
          style={{
            width: '322px',
            height: '203px',
            background: 'linear-gradient(180deg, #1E3A8A 0%, #000000 100%)',
            borderRadius: '11px',
            position: 'relative',
            fontFamily: "'Inter', 'Arial', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          {/* QR Code Section */}
          <div style={{
            width: '90px',
            height: '90px',
            background: '#FFFFFF',
            borderRadius: '6px',
            padding: '8px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" style={{ width: '100%', height: '100%' }} />
            ) : (
              <QrCode size={60} color="#000000" />
            )}
          </div>

          {/* Terms Text */}
          <div style={{
            textAlign: 'center',
            fontSize: '7px',
            color: '#FFFFFF',
            opacity: 0.9,
            lineHeight: '1.4',
            marginBottom: '12px',
            maxWidth: '280px'
          }}>
            <p>This card is property of Javelin Security.</p>
            <p>If found, please return to the nearest Javelin office.</p>
            <p>Scan QR code to verify authenticity.</p>
          </div>

          {/* Signature Strip */}
          <div style={{
            width: '100%',
            height: '30px',
            background: '#FFFFFF',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: '8px',
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(0,0,0,0.02) 5px, rgba(0,0,0,0.02) 10px)'
          }}>
            <div style={{
              fontSize: '8px',
              color: '#666666',
              fontWeight: '500'
            }}>
              AUTHORIZED SIGNATURE
            </div>
          </div>

          {/* Serial Number */}
          <div style={{
            fontSize: '7px',
            color: '#EAB308',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            SN: {serialNumber}
          </div>
        </div>
        </div>
      </div>

      {/* Specifications Info */}
      <div className="mt-6 bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Card Specifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <p className="font-medium text-gray-700">Physical Size</p>
            <p className="text-gray-600">CR80 Standard: 85.60 × 53.98 mm</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Material</p>
            <p className="text-gray-600">Matte PVC, 0.76mm thickness</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Orientation</p>
            <p className="text-gray-600">Vertical (Portrait)</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">QR Code</p>
            <p className="text-gray-600">22mm × 22mm with 2mm quiet zone</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Validity</p>
            <p className="text-gray-600">1 Year from issue date</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Security Features</p>
            <p className="text-gray-600">QR verification, role colors, anti-copy pattern</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        /* Mobile scaling for ID cards */}
        @media (max-width: 640px) {
          .card-front, .card-back {
            transform: scale(0.85);
            transform-origin: center;
          }
        }
        
        @media (max-width: 480px) {
          .card-front, .card-back {
            transform: scale(0.75);
            transform-origin: center;
          }
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .card-front, .card-back, .card-front *, .card-back * {
            visibility: visible;
          }
          .card-front, .card-back {
            position: absolute;
            left: 0;
            top: 0;
            width: 85.60mm !important;
            height: 53.98mm !important;
          }
          .card-back {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
};

export default ManagerIDCardGenerator;
