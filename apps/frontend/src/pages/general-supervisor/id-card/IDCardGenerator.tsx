import { useState, useEffect, useRef } from 'react';
import { Download, Printer, User, CreditCard } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuthStore } from '../../../stores/authStore';
import { getImageUrl } from '../../../lib/api';

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
  'GENERAL_SUPERVISOR': '#059669',
  'SUPERVISOR': '#3B82F6',
  'OPERATOR': '#EAB308',
  'MANAGER': '#8B5CF6',
  'DIRECTOR': '#DC2626',
  'SECRETARY': '#06B6D4',
};

export default function IDCardGenerator() {
  const { user } = useAuthStore();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set current logged-in user as the selected staff
    if (user) {
      console.log('👤 User data for ID card:', user);
      console.log('📝 Employee ID:', (user as any).employeeId);
      console.log('📸 Profile Photo:', user.profilePhoto);
      console.log('📸 Passport Photo:', (user as any).passportPhoto);
      console.log('🔗 Photo URL:', getImageUrl(user.profilePhoto || (user as any).passportPhoto));
      console.log('🎂 Date of Birth:', (user as any).dateOfBirth);
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
    return formatDate(date.toISOString());
  };

  const downloadAsPDF = async () => {
    if (!cardRef.current || !selectedStaff) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      // CR80 standard: 85.60mm x 53.98mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.60, 53.98]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 85.60, 53.98);
      
      pdf.save(`ID-Card-${selectedStaff.firstName}-${selectedStaff.lastName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const printCard = () => {
    if (!cardRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardHTML = cardRef.current.outerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print ID Card</title>
          <style>
            @page {
              size: 85.60mm 53.98mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${cardHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (!selectedStaff) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading your ID card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ID Card Generator</h1>
            <p className="text-gray-600 mt-1">Generate and download your professional ID card</p>
          </div>
          <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
        </div>
      </div>

      {/* Card Preview and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ID Card Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Card Preview</h2>
            
            <div className="flex justify-center">
              <div className="transform scale-75 sm:scale-85 md:scale-100 origin-center">
                {/* ID Card - CR80 Standard: 85.60mm x 53.98mm = 322.68px x 203.62px at 3.76 px/mm */}
                <div 
                  ref={cardRef}
                  style={{
                    width: '322px',
                    height: '203px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontFamily: 'Arial, sans-serif',
                    position: 'relative'
                  }}
                >
                  {/* Header Section with Deep Blue */}
                  <div style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    borderBottom: '2px solid #EAB308'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>J</span>
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          color: '#FFFFFF',
                          lineHeight: '1.2',
                          letterSpacing: '0.5px'
                        }}>JAVELIN SYSTEM</div>
                        <div style={{ 
                          fontSize: '7px', 
                          color: '#D1FAE5',
                          lineHeight: '1',
                          letterSpacing: '0.3px'
                        }}>Security Solutions</div>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: getRoleColor(selectedStaff.role),
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      letterSpacing: '0.3px',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      {selectedStaff.role.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div style={{ 
                    display: 'flex',
                    padding: '10px 12px',
                    gap: '10px',
                    height: 'calc(100% - 45px)'
                  }}>
                    {/* Left: Photo and QR */}
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      {/* Photo */}
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
                            position: 'relative',
                            zIndex: 2
                          }}>
                            <User size={40} color="#9CA3AF" />
                          </div>
                        )}
                      </div>

                      {/* QR Code */}
                      {qrCodeUrl && (
                        <div style={{
                          width: '45px',
                          height: '45px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: '#FFFFFF'
                        }}>
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div style={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      paddingTop: '2px'
                    }}>
                      {/* Name */}
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: '#111827',
                          lineHeight: '1.2',
                          marginBottom: '2px',
                          letterSpacing: '0.3px'
                        }}>
                          {selectedStaff.firstName} {selectedStaff.lastName}
                        </div>
                        
                        {/* ID */}
                        <div style={{
                          fontSize: '8px',
                          color: '#6B7280',
                          marginBottom: '6px',
                          fontWeight: '600'
                        }}>
                          ID: {selectedStaff.employeeId || selectedStaff.id || selectedStaff._id}
                        </div>

                        {/* Details Grid */}
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '3px',
                          marginBottom: '4px'
                        }}>
                          {/* State/LGA */}
                          {(selectedStaff.state || selectedStaff.lga) && (
                            <div style={{
                              fontSize: '7.5px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              marginBottom: '2px'
                            }}>
                              <span style={{ color: '#9CA3AF' }}>📍</span>
                              <span style={{ fontWeight: '600' }}>
                                {selectedStaff.state}{selectedStaff.lga && `, ${selectedStaff.lga}`}
                              </span>
                            </div>
                          )}

                          {selectedStaff.department && (
                            <div style={{
                              fontSize: '7.5px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <span style={{ color: '#9CA3AF' }}>🏢</span>
                              <span style={{ fontWeight: '600' }}>{selectedStaff.department}</span>
                            </div>
                          )}

                          {selectedStaff.email && (
                            <div style={{
                              fontSize: '7px',
                              color: '#6B7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              <span>✉️</span>
                              <span>{selectedStaff.email}</span>
                            </div>
                          )}

                          {selectedStaff.phoneNumber && (
                            <div style={{
                              fontSize: '7.5px',
                              color: '#6B7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <span>📞</span>
                              <span>{selectedStaff.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div style={{
                        borderTop: '1px solid #E5E7EB',
                        paddingTop: '4px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px'
                      }}>
                        <div>
                          <div style={{ fontSize: '6px', color: '#9CA3AF', marginBottom: '1px' }}>ISSUED</div>
                          <div style={{ fontSize: '7.5px', color: '#374151', fontWeight: '600' }}>
                            {formatDate(selectedStaff.createdAt)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '6px', color: '#9CA3AF', marginBottom: '1px' }}>EXPIRES</div>
                          <div style={{ fontSize: '7.5px', color: '#374151', fontWeight: '600' }}>
                            {getExpiryDate(selectedStaff.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Responsive Note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Note:</strong> This ID card follows the CR80 standard (85.60mm × 53.98mm). 
                The QR code links to a verification page showing staff details.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={downloadAsPDF}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg transition-colors duration-200"
              >
                <Download size={18} />
                <span className="font-medium">Download as PDF</span>
              </button>

              <button
                onClick={printCard}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors duration-200"
              >
                <Printer size={18} />
                <span className="font-medium">Print Card</span>
              </button>
            </div>

            {/* Card Details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Card Details</h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Standard</dt>
                  <dd className="font-medium text-gray-900">CR80 (85.60 × 53.98 mm)</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Thickness</dt>
                  <dd className="font-medium text-gray-900">0.76mm (30mil)</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Validity</dt>
                  <dd className="font-medium text-gray-900">1 Year</dd>
                </div>
                <div>
                  <dt className="text-gray-600">QR Code</dt>
                  <dd className="font-medium text-gray-900">Verification Enabled</dd>
                </div>
              </dl>
            </div>

            {/* Features */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>Professional CR80 standard format</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>QR code for instant verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>High-quality PDF export</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>Print-ready format</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
