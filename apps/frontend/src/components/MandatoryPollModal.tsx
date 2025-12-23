import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  MessageSquare,
  ListChecks,
  ThumbsUp,
  ThumbsDown,
  Star,
  FileText,
} from 'lucide-react';
import { Poll, PollOption, PollType } from '../types/poll';
import { pollService } from '../services/pollService';

interface MandatoryPollModalProps {
  children: React.ReactNode;
}

const MandatoryPollModal: React.FC<MandatoryPollModalProps> = ({ children }) => {
  const [pendingPolls, setPendingPolls] = useState<Poll[]>([]);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textResponse, setTextResponse] = useState('');
  const [scaleValue, setScaleValue] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch pending mandatory polls on component mount
  useEffect(() => {
    fetchPendingPolls();
  }, []);

  const fetchPendingPolls = async () => {
    setIsLoading(true);
    try {
      const polls = await pollService.getUserPendingPolls();
      const mandatoryPolls = polls.filter((p: Poll) => p.isMandatory);
      setPendingPolls(mandatoryPolls);
      if (mandatoryPolls.length > 0) {
        setCurrentPoll(mandatoryPolls[0]);
      }
    } catch (err) {
      console.error('Failed to fetch pending polls:', err);
      // In development, use mock data
      const mockPolls: Poll[] = [];
      setPendingPolls(mockPolls);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (optionId: string, pollType: PollType) => {
    if (pollType === 'SINGLE_CHOICE' || pollType === 'YES_NO') {
      setSelectedOptions([optionId]);
    } else if (pollType === 'MULTIPLE_CHOICE') {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const isResponseValid = (): boolean => {
    if (!currentPoll) return false;

    const pollType = currentPoll.type;
    switch (pollType) {
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE':
      case 'YES_NO':
        return selectedOptions.length > 0;
      case 'SCALE':
        return scaleValue >= 1 && scaleValue <= 5;
      case 'TEXT':
        return textResponse.trim().length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!currentPoll || !isResponseValid()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let responseData: any;
      const pollType = currentPoll.type;
      switch (pollType) {
        case 'SINGLE_CHOICE':
        case 'MULTIPLE_CHOICE':
        case 'YES_NO':
          responseData = { selectedOptions };
          break;
        case 'SCALE':
          responseData = { scaleValue };
          break;
        case 'TEXT':
          responseData = { textResponse };
          break;
      }

      await pollService.submitResponse(currentPoll.id, responseData);

      // Show success animation
      setShowSuccess(true);

      // Reset state and move to next poll
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedOptions([]);
        setTextResponse('');
        setScaleValue(3);

        const remainingPolls = pendingPolls.filter((p) => p.id !== currentPoll.id);
        setPendingPolls(remainingPolls);

        if (remainingPolls.length > 0) {
          setCurrentPoll(remainingPolls[0]);
        } else {
          setCurrentPoll(null);
        }
      }, 1500);
    } catch (err) {
      console.error('Failed to submit poll response:', err);
      setError('Failed to submit your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPollTypeIcon = (type: PollType) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return <ListChecks className="w-5 h-5" />;
      case 'MULTIPLE_CHOICE':
        return <ListChecks className="w-5 h-5" />;
      case 'SCALE':
        return <Star className="w-5 h-5" />;
      case 'YES_NO':
        return <ThumbsUp className="w-5 h-5" />;
      case 'TEXT':
        return <FileText className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const renderPollContent = () => {
    if (!currentPoll) return null;

    switch (currentPoll.type) {
      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-3">
            {currentPoll.options?.map((option: PollOption) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id, 'SINGLE_CHOICE')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedOptions.includes(option.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selectedOptions.includes(option.id) && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {option.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Select all that apply
            </p>
            {currentPoll.options?.map((option: PollOption) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id, 'MULTIPLE_CHOICE')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedOptions.includes(option.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selectedOptions.includes(option.id) && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {option.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'YES_NO':
        return (
          <div className="flex gap-4">
            <button
              onClick={() => handleOptionSelect('yes', 'YES_NO')}
              className={`flex-1 p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedOptions.includes('yes')
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    selectedOptions.includes('yes')
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <ThumbsUp
                    className={`w-8 h-8 ${
                      selectedOptions.includes('yes')
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`text-lg font-semibold ${
                    selectedOptions.includes('yes')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Yes
                </span>
              </div>
            </button>

            <button
              onClick={() => handleOptionSelect('no', 'YES_NO')}
              className={`flex-1 p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedOptions.includes('no')
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    selectedOptions.includes('no')
                      ? 'bg-red-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <ThumbsDown
                    className={`w-8 h-8 ${
                      selectedOptions.includes('no')
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`text-lg font-semibold ${
                    selectedOptions.includes('no')
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  No
                </span>
              </div>
            </button>
          </div>
        );

      case 'SCALE':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Not at all
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Very much
              </span>
            </div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setScaleValue(value)}
                  className={`w-14 h-14 rounded-xl text-lg font-bold transition-all duration-200 ${
                    scaleValue === value
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-110 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-8 h-8 transition-colors ${
                      value <= scaleValue
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'TEXT':
        return (
          <div className="space-y-3">
            <textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              placeholder="Type your response here..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
            <div className="flex justify-end">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {textResponse.length} characters
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If no mandatory polls, render children (the app)
  if (!currentPoll || pendingPolls.length === 0) {
    return <>{children}</>;
  }

  // Show mandatory poll modal
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-fadeIn">
          <div className="flex flex-col items-center gap-4 animate-scaleIn">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">Response Submitted!</p>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="relative w-full max-w-2xl mx-4 animate-slideUp">
        {/* Poll Counter Badge */}
        {pendingPolls.length > 1 && (
          <div className="absolute -top-3 -right-3 z-10 px-3 py-1 bg-orange-500 rounded-full text-white text-sm font-semibold shadow-lg">
            {pendingPolls.length} polls remaining
          </div>
        )}

        {/* Modal Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {getPollTypeIcon(currentPoll.type)}
              </div>
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                MANDATORY
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Poll Response Required
            </h2>
            <p className="text-white/80 text-sm">
              Please complete this poll before continuing
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Poll Info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {currentPoll.question}
              </h3>
              {currentPoll.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {currentPoll.description}
                </p>
              )}
            </div>

            {/* Expiry Warning */}
            {currentPoll.expiresAt && (
              <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Expires:{' '}
                    {new Date(currentPoll.expiresAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Poll Content */}
            <div className="mb-6">{renderPollContent()}</div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isResponseValid() || isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                isResponseValid() && !isSubmitting
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Response
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span>
                  Created by{' '}
                  {currentPoll.createdBy?.name || 'Director'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(currentPoll.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            You must complete all mandatory polls before accessing the system
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MandatoryPollModal;
