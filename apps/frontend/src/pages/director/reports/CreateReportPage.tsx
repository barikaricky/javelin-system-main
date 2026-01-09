import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Save,
  Send,
  X,
  Upload,
  Mic,
  MicOff,
  Image as ImageIcon,
  Paperclip,
  Calendar,
  Clock,
  MapPin,
  Shield,
  AlertCircle,
  Trash2,
  Play,
  Pause,
  Check,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';

// Report Types
const REPORT_TYPES = [
  { value: 'DAILY_ACTIVITY', label: 'Daily Activity Report', description: 'Regular operational activities' },
  { value: 'INCIDENT', label: 'Incident Report', description: 'Security incidents or breaches' },
  { value: 'EMERGENCY', label: 'Emergency Report', description: 'Urgent situations requiring immediate attention' },
  { value: 'VISITOR_LOG', label: 'Visitor Log Report', description: 'Visitor entry and exit records' },
  { value: 'PATROL', label: 'Patrol Report', description: 'Patrol rounds and observations' },
  { value: 'EQUIPMENT', label: 'Equipment / Asset Report', description: 'Equipment status and issues' },
  { value: 'CLIENT_INSTRUCTION', label: 'Client Instruction Report', description: 'Special instructions from clients' },
  { value: 'END_OF_SHIFT', label: 'End-of-Shift Report', description: 'Shift handover summary' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-blue-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-600' },
];

interface Location {
  _id: string;
  locationName: string;
  city: string;
}

interface Beat {
  _id: string;
  beatName: string;
  beatCode: string;
}

interface Supervisor {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
  };
}

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    reportType: '',
    beatId: '',
    locationId: '',
    supervisorId: '',
    occurrenceDate: new Date().toISOString().split('T')[0],
    occurrenceTime: new Date().toTimeString().slice(0, 5),
    description: '',
    chronologicalNarrative: '',
    priority: 'MEDIUM',
    tags: [] as string[],
  });

  // File state
  const [images, setImages] = useState<File[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Data state
  const [locations, setLocations] = useState<Location[]>([]);
  const [beats, setBits] = useState<Beat[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tag input
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locationsRes, bitsRes, supervisorsRes] = await Promise.all([
        api.get('/locations'),
        api.get('/beats'),
        api.get('/supervisors'),
      ]);
      
      setLocations(locationsRes.data.locations || []);
      setBits(bitsRes.data.beats || []);
      setSupervisors(supervisorsRes.data.supervisors || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        setAudioFiles(prev => [...prev, file]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioChunks(chunks);
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success('Recording saved');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // File handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length !== files.length) {
      toast.error('Some files were skipped (only images allowed)');
    }
    
    setImages(prev => [...prev, ...validImages]);
    
    // Generate previews
    validImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    toast.success(`${validImages.length} image(s) added`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) attached`);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeAudio = (index: number) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Report title is required');
      return;
    }
    if (!formData.reportType) {
      toast.error('Please select a report type');
      return;
    }
    if (!formData.beatId) {
      toast.error('Please select a BEAT');
      return;
    }
    if (!formData.locationId) {
      toast.error('Please select a location');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      setSaving(true);
      
      // Debug logging
      const token = localStorage.getItem('token');
      console.log('🔐 Creating report with:', {
        hasToken: !!token,
        tokenLength: token?.length,
        userRole: user?.role,
        userEmail: user?.email,
        isDraft,
        status: isDraft ? 'DRAFT' : 'PENDING_REVIEW',
      });
      
      // Create FormData
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('reportType', formData.reportType);
      submitData.append('beatId', formData.beatId);
      submitData.append('locationId', formData.locationId);
      if (formData.supervisorId) submitData.append('supervisorId', formData.supervisorId);
      submitData.append('occurrenceDate', formData.occurrenceDate);
      submitData.append('occurrenceTime', formData.occurrenceTime);
      submitData.append('description', formData.description);
      if (formData.chronologicalNarrative) submitData.append('chronologicalNarrative', formData.chronologicalNarrative);
      submitData.append('priority', formData.priority);
      submitData.append('tags', JSON.stringify(formData.tags));
      submitData.append('status', isDraft ? 'DRAFT' : 'PENDING_REVIEW');
      
      // Append images
      images.forEach(image => {
        submitData.append('images', image);
      });
      
      // Append audio
      audioFiles.forEach(audio => {
        submitData.append('audio', audio);
      });
      
      // Append files
      attachedFiles.forEach(file => {
        submitData.append('files', file);
      });
      
      const response = await api.post('/reports', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(isDraft ? 'Report saved as draft' : 'Report submitted and approved');
      navigate('/director/reports');
    } catch (error: any) {
      console.error('Failed to create report:', error);
      toast.error(error.response?.data?.message || 'Failed to create report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/director/reports')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
          >
            <X className="w-5 h-5" />
            Back to Reports
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            Create New Report
          </h1>
          <p className="text-gray-600 mt-2">
            Official operational record - All fields marked with * are required
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
          {/* Report Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Report Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, reportType: type.value }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.reportType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Basic Information
            </h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a clear, descriptive title"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Occurrence Date *
                  </label>
                  <input
                    type="date"
                    value={formData.occurrenceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, occurrenceDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Occurrence Time *
                  </label>
                  <input
                    type="time"
                    value={formData.occurrenceTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, occurrenceTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location and BEAT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location *
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location._id} value={location._id}>
                        {location.locationName} - {location.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-1" />
                    BEAT *
                  </label>
                  <select
                    value={formData.beatId}
                    onChange={(e) => setFormData(prev => ({ ...prev, beatId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select BEAT</option>
                    {beats.map(bit => (
                      <option key={bit._id} value={bit._id}>
                        {bit.beatName} ({bit.beatCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supervisor and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor (Optional)
                  </label>
                  <select
                    value={formData.supervisorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, supervisorId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Auto-assign</option>
                    {supervisors.map(supervisor => (
                      <option key={supervisor._id} value={supervisor._id}>
                        {supervisor.userId.firstName} {supervisor.userId.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PRIORITIES.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Description with Voice-to-Text */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Detailed Description *
            </h2>
            
            <div className="space-y-4">
              {/* Voice Recording */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-purple-600" />
                      Voice Recording (Optional)
                    </h3>
                    <p className="text-sm text-gray-600">Record audio evidence or notes</p>
                  </div>
                  {isRecording && (
                    <span className="text-red-600 font-mono font-bold animate-pulse">
                      {formatTime(recordingTime)}
                    </span>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Start Recording
                    </>
                  )}
                </button>
                
                {audioFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {audioFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeAudio(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Structured Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what happened - be objective and factual&#10;&#10;Include:&#10;- What occurred&#10;- When it happened&#10;- Who was involved&#10;- Any immediate actions taken"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
              </div>

              {/* Chronological Narrative */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chronological Narrative (Optional)
                </label>
                <textarea
                  value={formData.chronologicalNarrative}
                  onChange={(e) => setFormData(prev => ({ ...prev, chronologicalNarrative: e.target.value }))}
                  placeholder="Detailed timeline of events&#10;&#10;Example:&#10;20:00 - Patrol commenced at main gate&#10;20:15 - Unusual activity observed at sector B&#10;20:20 - Backup requested and arrived&#10;20:30 - Situation resolved"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Evidence Attachments */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Evidence & Attachments
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-all">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Upload Images</h3>
                <p className="text-sm text-gray-600 mb-3">Photos, screenshots, evidence</p>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Choose Images
                </button>
                {images.length > 0 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">{images.length} image(s) selected</p>
                )}
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Attach Files</h3>
                <p className="text-sm text-gray-600 mb-3">PDFs, documents, instructions</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Choose Files
                </button>
                {attachedFiles.length > 0 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">{attachedFiles.length} file(s) attached</p>
                )}
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Image Previews</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File List */}
            {attachedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Attached Files</h3>
                <div className="space-y-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tags (Optional)
            </h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags for easier searching (press Enter)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Submit & Approve
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Director Privileges:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Your reports are automatically approved upon submission</li>
                  <li>No review process required for Director-created reports</li>
                  <li>Reports become read-only once approved</li>
                  <li>All actions are logged for audit purposes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
