import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Target,
  Clock,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pollService } from '../../../services/pollService';

interface PollOption {
  id: string;
  text: string;
}

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    targetRole: '', // empty means all roles
    isMandatory: true,
    hasExpiry: false,
    expiresAt: '',
  });
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);

  const roleOptions = [
    { value: '', label: 'All Users' },
    { value: 'MANAGER', label: 'Managers Only' },
    { value: 'GENERAL_SUPERVISOR', label: 'General Supervisors Only' },
    { value: 'SUPERVISOR', label: 'Supervisors Only' },
    { value: 'OPERATOR', label: 'Operators Only' },
    { value: 'SECRETARY', label: 'Secretaries Only' },
  ];

  const addOption = () => {
    if (options.length >= 10) {
      toast.error('Maximum 10 options allowed');
      return;
    }
    setOptions([...options, { id: Date.now().toString(), text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.question.trim()) {
      toast.error('Please enter a poll question');
      return;
    }

    const validOptions = options.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    // Check for duplicate options
    const optionTexts = validOptions.map((opt) => opt.text.trim().toLowerCase());
    if (new Set(optionTexts).size !== optionTexts.length) {
      toast.error('Options must be unique');
      return;
    }

    if (formData.hasExpiry && !formData.expiresAt) {
      toast.error('Please set an expiry date or disable expiry');
      return;
    }

    setIsSubmitting(true);

    try {
      await pollService.createPoll({
        question: formData.question.trim(),
        description: formData.description.trim() || undefined,
        type: 'SINGLE_CHOICE',
        options: validOptions.map((opt) => ({ text: opt.text.trim() })),
        targetRole: formData.targetRole || null,
        isMandatory: formData.isMandatory,
        expiresAt: formData.hasExpiry ? formData.expiresAt : null,
      });

      toast.success('Poll created successfully!');
      navigate('/director/polls/active');
    } catch (error: any) {
      console.error('Failed to create poll:', error);
      toast.error(error.response?.data?.message || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New Poll</h1>
              <p className="text-indigo-200 mt-1">
                Gather feedback and opinions from your team
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Question Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Poll Question
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="What would you like to ask?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.question.length}/200
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional context or instructions..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.description.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Poll Options Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Answer Options
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    disabled={options.length <= 2}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                disabled={options.length >= 10}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Add Option
              </button>
              <p className="text-xs text-gray-400 text-center">
                {options.length}/10 options (minimum 2 required)
              </p>
            </div>
          </div>

          {/* Poll Settings Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Poll Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Target Audience
                </label>
                <select
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Select which user roles should see and respond to this poll
                </p>
              </div>

              {/* Mandatory Toggle */}
              <div className="flex items-start justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Mandatory Poll</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Users must answer this poll before accessing the system
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>

              {/* Expiry Date Toggle */}
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Set Expiry Date</h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Automatically close the poll after a specific date
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasExpiry}
                      onChange={(e) => setFormData({ ...formData, hasExpiry: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                {formData.hasExpiry && (
                  <div className="pl-4 border-l-4 border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Expiry Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      min={getMinDateTime()}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Card */}
          {formData.question && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Preview</h2>
              </div>
              <div className="p-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {formData.question || 'Your question here...'}
                  </h3>
                  {formData.description && (
                    <p className="text-gray-600 mb-4">{formData.description}</p>
                  )}
                  <div className="space-y-3">
                    {options
                      .filter((opt) => opt.text.trim())
                      .map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all"
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-indigo-400" />
                          <span className="text-gray-700">{option.text}</span>
                        </div>
                      ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    {formData.isMandatory && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Mandatory
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {formData.targetRole
                        ? roleOptions.find((r) => r.value === formData.targetRole)?.label
                        : 'All Users'}
                    </span>
                    {formData.hasExpiry && formData.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Expires: {new Date(formData.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Poll...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Create Poll
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
