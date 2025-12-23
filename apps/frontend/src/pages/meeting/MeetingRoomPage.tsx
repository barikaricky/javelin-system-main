import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ChevronLeft,
  ExternalLink,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { meetingService } from '../../services/meetingService';
import type { Meeting } from '../../types/meeting';

// Use free Jitsi Meet (powered by 8x8)
const JITSI_DOMAIN = 'meet.jit.si';

export default function MeetingRoomPage() {
  const { meetingLink } = useParams<{ meetingLink: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  // State
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Load Jitsi Meet External API script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('Jitsi External API loaded');
      setIsJitsiLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Jitsi External API');
      setIsJitsiLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch meeting details
  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingLink) {
        setError('Invalid meeting link');
        setIsLoading(false);
        return;
      }

      try {
        const meetingData = await meetingService.getMeetingByLink(meetingLink);
        setMeeting(meetingData);
        
        const now = new Date();
        const scheduledTime = new Date(meetingData.scheduledTime);
        const timeDiff = scheduledTime.getTime() - now.getTime();
        const minutesUntilMeeting = timeDiff / (1000 * 60);

        if (minutesUntilMeeting > 15 && meetingData.status === 'SCHEDULED') {
          setError(`Meeting hasn't started yet. It's scheduled for ${scheduledTime.toLocaleString()}`);
        } else if (meetingData.status === 'CANCELLED') {
          setError('This meeting has been cancelled.');
        } else if (meetingData.status === 'ENDED') {
          setError('This meeting has ended.');
        } else {
          if (meetingData.organizer?.userId === user?.id && meetingData.status === 'SCHEDULED') {
            try {
              await meetingService.startMeeting(meetingData.id);
            } catch (e) {
              console.log('Meeting may already be started');
            }
          }
          setIsMeetingStarted(true);
        }
      } catch (err: any) {
        console.error('Failed to fetch meeting:', err);
        setError(err.response?.data?.error || 'Failed to load meeting details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingLink, user?.id]);

  // Initialize Jitsi Meeting
  useEffect(() => {
    if (!isMeetingStarted || !isJitsiLoaded || !meeting || !jitsiContainerRef.current) return;
    if (jitsiApiRef.current) return;

    const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
    
    if (!JitsiMeetExternalAPI) {
      console.log('JitsiMeetExternalAPI not available, using iframe fallback');
      return;
    }

    try {
      const roomName = `jevelin-${meeting.meetingLink}`;
      
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user ? `${user.firstName} ${user.lastName}` : 'Guest',
          email: user?.email || '',
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          disableModeratorIndicator: false,
          enableLobby: false,
          hideLobbyButton: true,
          requireDisplayName: false,
          enableInsecureRoomNameWarning: false,
          disableRemoteMute: false,
          remoteVideoMenu: {
            disableGrantModerator: true,
          },
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          MOBILE_APP_PROMO: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          DEFAULT_BACKGROUND: '#1a1a2e',
        },
      };

      console.log('Initializing Jitsi with room:', roomName);
      const api = new JitsiMeetExternalAPI(JITSI_DOMAIN, options);
      jitsiApiRef.current = api;

      api.addListener('videoConferenceJoined', () => {
        console.log('Joined video conference');
        toast.success('Joined meeting successfully');
      });

      api.addListener('videoConferenceLeft', () => {
        console.log('Left video conference');
        handleLeaveMeeting();
      });

      api.addListener('audioMuteStatusChanged', (data: { muted: boolean }) => {
        setIsAudioMuted(data.muted);
      });

      api.addListener('videoMuteStatusChanged', (data: { muted: boolean }) => {
        setIsVideoMuted(data.muted);
      });

      api.addListener('readyToClose', () => {
        handleLeaveMeeting();
      });

    } catch (err) {
      console.error('Failed to initialize Jitsi:', err);
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [isMeetingStarted, isJitsiLoaded, meeting, user]);

  // Meeting duration timer
  useEffect(() => {
    if (!isMeetingStarted) return;

    const interval = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMeetingStarted]);

  const handleLeaveMeeting = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    navigate(-1);
  };

  const endMeetingForAll = async () => {
    if (!meeting) return;
    
    if (window.confirm('Are you sure you want to end the meeting for all participants?')) {
      try {
        await meetingService.endMeeting(meeting.id);
        toast.success('Meeting ended');
        if (jitsiApiRef.current) {
          jitsiApiRef.current.executeCommand('hangup');
        }
        navigate(-1);
      } catch (error: any) {
        toast.error('Failed to end meeting');
      }
    }
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/meeting/${meetingLink}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success('Meeting link copied!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const toggleScreenShare = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleShareScreen');
    }
  };

  const toggleChat = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleChat');
    }
  };

  // Generate Jitsi room URL - using 8x8.vc which is free and doesn't require auth
  const getJitsiUrl = () => {
    if (!meeting || !user) return '';
    
    const roomName = `JevelinMeeting${meeting.meetingLink.replace(/-/g, '')}`;
    const displayName = encodeURIComponent(`${user.firstName} ${user.lastName}`);
    
    // Build URL with config parameters
    const configParams = [
      'config.prejoinPageEnabled=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      'config.disableDeepLinking=true',
      'config.enableWelcomePage=false',
      'config.enableClosePage=false',
      'config.enableLobby=false',
      'config.hideLobbyButton=true',
      'config.requireDisplayName=false',
      'config.enableInsecureRoomNameWarning=false',
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
      'interfaceConfig.MOBILE_APP_PROMO=false',
    ].join('&');

    return `https://8x8.vc/vpaas-magic-cookie-ef5ce88c523d41a599c8b1dc5b3ab765/${roomName}#userInfo.displayName="${displayName}"&${configParams}`;
  };

  const openInNewTab = () => {
    const url = getJitsiUrl();
    window.open(url, '_blank');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Joining Meeting...</h2>
          <p className="text-gray-400">Please wait while we connect you</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Cannot Join Meeting</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLeaveMeeting}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-semibold truncate max-w-[200px] sm:max-w-none">
              {meeting?.title || 'Meeting'}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(meetingDuration)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                In Progress
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openInNewTab}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </button>
          <button
            onClick={copyMeetingLink}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
          
          {meeting?.organizer?.userId === user?.id && (
            <button
              onClick={endMeetingForAll}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              End Meeting
            </button>
          )}
        </div>
      </div>

      {/* Video Container - Using Jitsi API or iframe fallback */}
      <div className="flex-1 relative">
        {isMeetingStarted && meeting && (
          <>
            {/* Jitsi container for External API */}
            <div 
              ref={jitsiContainerRef} 
              className="absolute inset-0"
              style={{ display: jitsiApiRef.current ? 'block' : 'none' }}
            />
            
            {/* Fallback iframe if External API fails */}
            {!jitsiApiRef.current && (
              <iframe
                src={getJitsiUrl()}
                className="absolute inset-0 w-full h-full border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                allowFullScreen
                title="Video Meeting"
              />
            )}
          </>
        )}
      </div>

      {/* Bottom Controls - Only show when using External API */}
      {jitsiApiRef.current && (
        <div className="bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-colors ${
                isAudioMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
              title="Share screen"
            >
              <Monitor className="w-6 h-6" />
            </button>

            <button
              onClick={toggleChat}
              className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
              title="Chat"
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            <button
              onClick={handleLeaveMeeting}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              title="Leave meeting"
            >
              <Phone className="w-6 h-6 rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
