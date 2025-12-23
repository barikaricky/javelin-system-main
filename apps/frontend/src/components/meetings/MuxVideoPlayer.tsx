import { useEffect, useRef, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Users } from 'lucide-react';

interface MuxVideoPlayerProps {
  playbackId?: string;
  environmentKey: string;
  isHost?: boolean;
  participantCount?: number;
  onLeave?: () => void;
}

export default function MuxVideoPlayer({ 
  playbackId, 
  environmentKey,
  isHost = false,
  participantCount = 1,
  onLeave 
}: MuxVideoPlayerProps) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Initialize video/audio stream
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (playerRef.current) {
          playerRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      // Cleanup: stop all media tracks
      if (playerRef.current && playerRef.current.srcObject) {
        const stream = playerRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (playerRef.current && playerRef.current.srcObject) {
      const stream = playerRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (playerRef.current && playerRef.current.srcObject) {
      const stream = playerRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-dark-900 rounded-xl overflow-hidden">
      {/* Video Display */}
      <div className="relative w-full aspect-video">
        {playbackId ? (
          <MuxPlayer
            streamType="on-demand"
            playbackId={playbackId}
            envKey={environmentKey}
            metadata={{
              video_title: 'Team Meeting',
              viewer_user_id: 'user-id'
            }}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-dark-800 flex items-center justify-center">
            <video
              ref={playerRef}
              autoPlay
              playsInline
              muted={isMuted}
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-dark-900 text-3xl font-bold">
                  MD
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participant Count Badge */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
          <Users className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">{participantCount}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 sm:p-6">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </button>

          {/* Video On/Off */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </button>

          {/* Leave Meeting */}
          <button
            onClick={onLeave}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
            title="Leave meeting"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Settings */}
          {isHost && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-2xl p-4 w-64 z-10">
          <h3 className="font-semibold text-gray-900 mb-3">Meeting Settings</h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span>Enable waiting room</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span>Mute participants on entry</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span>Enable recording</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
