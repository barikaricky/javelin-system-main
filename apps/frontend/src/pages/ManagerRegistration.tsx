import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerApi, ManagerRegistrationData } from '../services/api.service';

export default function ManagerRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const [formData, setFormData] = useState<ManagerRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'manager',
    department: '',
    startDate: '',
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key as keyof ManagerRegistrationData]);
      });
      
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }

      await managerApi.register(submitData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/managers');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register manager');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-lg max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-xl">
        <h1 className="text-page-title mb-sm">Register New Manager</h1>
        <p className="text-base text-gray-600">
          Fill in the details below to register a new manager in the system
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="badge-success p-lg mb-lg rounded-lg flex items-center gap-md">
          <span className="text-lg">✓</span>
          <div>
            <p className="font-semibold">Manager registered successfully!</p>
            <p className="text-sm">Credentials have been sent to their email.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="badge-error p-lg mb-lg rounded-lg flex items-center gap-md">
          <span className="text-lg">⚠</span>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-lg">
          {/* Profile Picture Upload */}
          <div>
            <h2 className="text-section-header mb-md">Profile Picture</h2>
            <div className="flex items-center gap-lg">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="label">Upload Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="input-field"
                  disabled={loading}
                />
                <p className="text-xs text-gray-600 mt-xs">
                  Recommended: Square image, at least 400x400px. Max size: 5MB
                </p>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePicture(null);
                      setPreviewUrl('');
                    }}
                    className="text-sm text-error hover:underline mt-xs"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h2 className="text-section-header mb-md">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter first name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter last name"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-section-header mb-md">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="manager@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+1 (555) 000-0000"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h2 className="text-section-header mb-md">Work Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="label">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={loading}
                >
                  <option value="manager">Manager</option>
                  <option value="senior-manager">Senior Manager</option>
                  <option value="team-lead">Team Lead</option>
                </select>
              </div>

              <div>
                <label className="label">Department *</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Sales, Marketing"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-md pt-lg border-t border-gray-200">
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Manager'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-cancel flex-1"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
