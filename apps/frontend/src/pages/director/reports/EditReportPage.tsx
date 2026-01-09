import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Save,
  Send,
  X,
  Play,
  StopCircle,
  Upload,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { toast } from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'DAILY_ACTIVITY', label: 'Daily Activity Report', description: 'Regular shift activities and observations' },
  { value: 'INCIDENT', label: 'Incident Report', description: 'Unusual events requiring documentation' },
  { value: 'EMERGENCY', label: 'Emergency Report', description: 'Critical situations requiring immediate attention' },
  { value: 'VISITOR_LOG', label: 'Visitor Log Report', description: 'Guest access and visit documentation' },
  { value: 'PATROL', label: 'Patrol Report', description: 'Regular patrol rounds and checks' },
  { value: 'EQUIPMENT', label: 'Equipment / Asset Report', description: 'Asset condition and maintenance' },
  { value: 'CLIENT_INSTRUCTION', label: 'Client Instruction Report', description: 'Client directives and special instructions' },
  { value: 'END_OF_SHIFT', label: 'End-of-Shift Report', description: 'Shift summary and handover notes' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

interface Location {
  _id: string;
  locationName: string;
  address: string;
  city: string;
}

interface BEAT {
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

export default function EditReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    reportType: '',
    priority: 'MEDIUM',
    locationId: '',
    beatId: '',
    supervisorId: '',
    occurrenceDate: '',
    occurrenceTime: '',
    description: '',
    chronologicalNarrative: '',
    tags: [] as string[],
  });

  // File states
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [existingAudio, setExistingAudio] = useState<any[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newAudioFiles, setNewAudioFiles] = useState<File[]>([]);
  const [newAttachedFiles, setNewAttachedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [deletedAudio, setDeletedAudio] = useState<string[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);

  // Options
  const [locations, setLocations] = useState<Location[]>([]);
  const [beats, setBits] = useState<BEAT[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchOptions();
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [locationsRes, bitsRes, supervisorsRes] = await Promise.all([
        api.get('/locations'),
        api.get('/beats'),
        api.get('/supervisors'),
      ]);
      setLocations(locationsRes.data.locations || []);
      setBits(bitsRes.data.beats || []);
      setSupervisors(supervisorsRes.data.supervisors || []);
    } catch (error) {
      console.error('Failed to fetch options:', error);
      toast.error('Failed to load form options');
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/${id}`);
      const report = response.data.report;

      // Check if report can be edited
      if (report.isLocked) {
        toast.error('This report is locked and cannot be edited');
        navigate(`/director/reports/${id}`);
        return;
      }

      setFormData({
        title: report.title,
        reportType: report.reportType,
        priority: report.priority,
        locationId: report.locationId._id,
        beatId: report.beatId._id,
        supervisorId: report.supervisorId._id,
        occurrenceDate: report.occurrenceDate.split('T')[0],
        occurrenceTime: report.occurrenceTime,
        description: report.description,
        chronologicalNarrative: report.chronologicalNarrative || '',
        tags: report.tags || [],
      });

      setExistingImages(report.images || []);
      setExistingAudio(report.audioRecordings || []);
      setExistingFiles(report.attachedFiles || []);
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      toast.error('Failed to load report');
      navigate('/director/reports');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        setNewAudioFiles((prev) => [...prev, audioFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      toast.success('Recording saved');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed');
      return;
    }

    setNewImages((prev) => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewAttachedFiles((prev) => [...prev, ...files]);
  };

  const removeExistingImage = (imageUrl: string) => {
    setDeletedImages((prev) => [...prev, imageUrl]);
    setExistingImages((prev) => prev.filter((img) => img.url !== imageUrl));
  };

  const removeExistingAudio = (audioUrl: string) => {
    setDeletedAudio((prev) => [...prev, audioUrl]);
    setExistingAudio((prev) => prev.filter((audio) => audio.url !== audioUrl));
  };

  const removeExistingFile = (fileUrl: string) => {
    setDeletedFiles((prev) => [...prev, fileUrl]);
    setExistingFiles((prev) => prev.filter((file) => file.url !== fileUrl));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewAudio = (index: number) => {
    setNewAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (isDraft: boolean) => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a report title');
      return;
    }
    if (!formData.reportType) {
      toast.error('Please select a report type');
      return;
    }
    if (!formData.locationId) {
      toast.error('Please select a location');
      return;
    }
    if (!formData.beatId) {
      toast.error('Please select a BEAT');
      return;
    }
    if (!formData.supervisorId) {
      toast.error('Please select a supervisor');
      return;
    }
    if (!formData.occurrenceDate) {
      toast.error('Please select occurrence date');
      return;
    }
    if (!formData.occurrenceTime) {
      toast.error('Please select occurrence time');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setSubmitting(true);

      const data = new FormData();
      data.append('title', formData.title);
      data.append('reportType', formData.reportType);
      data.append('priority', formData.priority);
      data.append('locationId', formData.locationId);
      data.append('beatId', formData.beatId);
      data.append('supervisorId', formData.supervisorId);
      data.append('occurrenceDate', formData.occurrenceDate);
      data.append('occurrenceTime', formData.occurrenceTime);
      data.append('description', formData.description);
      data.append('chronologicalNarrative', formData.chronologicalNarrative);
      data.append('tags', JSON.stringify(formData.tags));
      data.append('status', isDraft ? 'DRAFT' : 'PENDING_REVIEW');

      // Add deleted file references
      data.append('deletedImages', JSON.stringify(deletedImages));
      data.append('deletedAudio', JSON.stringify(deletedAudio));
      data.append('deletedFiles', JSON.stringify(deletedFiles));

      // Add new images
      newImages.forEach((image) => {
        data.append('images', image);
      });

      // Add new audio files
      newAudioFiles.forEach((audio) => {
        data.append('audioRecordings', audio);
      });

      // Add new attached files
      newAttachedFiles.forEach((file) => {
        data.append('attachedFiles', file);
      });

      await api.put(`/reports/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(isDraft ? 'Report updated as draft' : 'Report updated and submitted for review');
      navigate(`/director/reports/${id}`);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to update report');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/director/reports/${id}`)}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Report
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Edit Report</h1>
          <p className="text-gray-600">Update report information and evidence</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          {/* Report Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, reportType: type.value }))}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.reportType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter report title"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occurrence Date *
              </label>
              <input
                type="date"
                value={formData.occurrenceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, occurrenceDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occurrence Time *
              </label>
              <input
                type="time"
                value={formData.occurrenceTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, occurrenceTime: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.locationName} - {location.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BEAT *
              </label>
              <select
                value={formData.beatId}
                onChange={(e) => setFormData((prev) => ({ ...prev, beatId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select BEAT</option>
                {beats.map((bit) => (
                  <option key={bit._id} value={bit._id}>
                    {bit.beatName} ({bit.beatCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supervisor *
              </label>
              <select
                value={formData.supervisorId}
                onChange={(e) => setFormData((prev) => ({ ...prev, supervisorId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Supervisor</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor._id} value={supervisor._id}>
                    {supervisor.userId.firstName} {supervisor.userId.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voice Recording */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-600" />
              Voice Recording
            </label>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium"
                >
                  <Play className="w-6 h-6" />
                  Start Voice Recording
                </button>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-2xl font-bold text-gray-900">{formatTime(recordingTime)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 mx-auto font-medium"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop Recording
                  </button>
                </div>
              )}
              {newAudioFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">New Recordings:</p>
                  {newAudioFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewAudio(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {existingAudio.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Existing Recordings:</p>
                  {existingAudio.map((audio, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2">
                      <span className="text-sm text-gray-700">{audio.filename}</span>
                      <button
                        type="button"
                        onClick={() => removeExistingAudio(audio.url)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a detailed description of what happened..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Chronological Narrative */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chronological Narrative
            </label>
            <textarea
              value={formData.chronologicalNarrative}
              onChange={(e) => setFormData((prev) => ({ ...prev, chronologicalNarrative: e.target.value }))}
              placeholder="Timeline of events (optional)..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>

          {/* Image Evidence */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              Image Evidence
            </label>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 font-medium">Upload Images</span>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Existing Images:</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getImageUrl(image.url)}
                          alt={image.filename}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.url)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {imagePreviews.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">New Images:</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attached Files */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-green-600" />
              Attached Documents
            </label>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 font-medium">Upload Documents</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Existing Files */}
              {existingFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Existing Files:</p>
                  {existingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-2">
                      <span className="text-sm text-gray-700">{file.filename}</span>
                      <button
                        type="button"
                        onClick={() => removeExistingFile(file.url)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Files */}
              {newAttachedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">New Files:</p>
                  {newAttachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-2">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
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
                      type="button"
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

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Update & Submit for Review
                </>
              )}
            </button>
          </div>

          {/* Info Alert */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Note:</p>
                <p>Once this report is approved, it will be locked and cannot be edited further. Make sure all information is accurate before submitting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
