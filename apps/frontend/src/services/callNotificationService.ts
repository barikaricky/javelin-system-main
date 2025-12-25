import { api } from '../lib/api';

export interface CallNotification {
  callId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  conversationId: string;
  callType: 'voice' | 'video';
  timestamp: number;
}

export interface CallSignal {
  type: 'call-initiated' | 'call-ringing' | 'call-accepted' | 'call-rejected' | 'call-ended' | 'call-cancelled';
  callId: string;
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  callType: 'voice' | 'video';
  roomUrl?: string;
  timestamp: number;
}

class CallNotificationService {
  private notificationPermission: NotificationPermission = 'default';
  private activeNotifications: Map<string, Notification> = new Map();
  private callListeners: Map<string, (signal: CallSignal) => void> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastPollTime: number = Date.now();
  private ringtone: HTMLAudioElement | null = null;
  private isRinging = false;

  constructor() {
    this.initializeNotifications();
    this.initializeRingtone();
  }

  /**
   * Initialize browser notifications
   */
  private async initializeNotifications() {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
      
      if (this.notificationPermission === 'default') {
        try {
          this.notificationPermission = await Notification.requestPermission();
        } catch (error) {
          console.error('Failed to request notification permission:', error);
        }
      }
    }
  }

  /**
   * Initialize ringtone audio
   */
  private initializeRingtone() {
    // Using a data URI for a simple ringtone beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a simple ringtone using Web Audio API
    this.ringtone = new Audio();
    this.ringtone.loop = true;
    this.ringtone.volume = 0.5;
    
    // Generate a simple ringtone (alternating tones)
    this.generateRingtone(audioContext);
  }

  private async generateRingtone(audioContext: AudioContext) {
    const sampleRate = audioContext.sampleRate;
    const duration = 2; // 2 seconds
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create alternating tones (similar to a phone ring)
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq1 = 440; // A4
      const freq2 = 554; // C#5
      
      // Alternate between two frequencies
      const freq = (Math.floor(t * 2) % 2 === 0) ? freq1 : freq2;
      
      // Add envelope (fade in/out)
      const envelope = Math.sin((t % 1) * Math.PI);
      
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    source.connect(mediaStreamDestination);
    
    if (this.ringtone) {
      this.ringtone.srcObject = mediaStreamDestination.stream;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (this.notificationPermission === 'granted') {
      return true;
    }

    try {
      this.notificationPermission = await Notification.requestPermission();
      return this.notificationPermission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Show browser notification for incoming call
   */
  async showCallNotification(callNotification: CallNotification): Promise<void> {
    if (this.notificationPermission !== 'granted') {
      await this.requestPermission();
    }

    if (this.notificationPermission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Close any existing notification for this call
    this.closeNotification(callNotification.callId);

    const title = `Incoming ${callNotification.callType === 'video' ? 'Video' : 'Voice'} Call`;
    const body = `${callNotification.callerName} is calling you`;
    const icon = callNotification.callerPhoto || '/default-avatar.png';

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: callNotification.callId,
        requireInteraction: true, // Keep notification visible until user interacts
        vibrate: [200, 100, 200, 100, 200, 100, 200], // Vibration pattern
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'reject', title: 'Reject' }
        ],
        data: callNotification
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        this.handleAcceptCall(callNotification);
        notification.close();
      };

      this.activeNotifications.set(callNotification.callId, notification);
      
      // Start ringtone
      this.startRingtone();

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Start ringtone sound
   */
  private startRingtone() {
    if (this.ringtone && !this.isRinging) {
      this.isRinging = true;
      this.ringtone.play().catch(err => {
        console.error('Failed to play ringtone:', err);
      });
    }
  }

  /**
   * Stop ringtone sound
   */
  private stopRingtone() {
    if (this.ringtone && this.isRinging) {
      this.isRinging = false;
      this.ringtone.pause();
      this.ringtone.currentTime = 0;
    }
  }

  /**
   * Close notification
   */
  closeNotification(callId: string) {
    const notification = this.activeNotifications.get(callId);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(callId);
    }
    this.stopRingtone();
  }

  /**
   * Close all active notifications
   */
  closeAllNotifications() {
    this.activeNotifications.forEach(notification => notification.close());
    this.activeNotifications.clear();
    this.stopRingtone();
  }

  /**
   * Send call signal to backend
   */
  async sendCallSignal(signal: Omit<CallSignal, 'timestamp'>): Promise<void> {
    try {
      await api.post('/messaging/call-signal', {
        ...signal,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to send call signal:', error);
      throw error;
    }
  }

  /**
   * Start polling for incoming call signals
   */
  startPolling(userId: string, onCallSignal: (signal: CallSignal) => void) {
    // Stop existing polling
    this.stopPolling();

    // Poll every 2 seconds for incoming calls
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await api.get<{ signals: CallSignal[] }>(
          `/messaging/call-signals?since=${this.lastPollTime}`
        );
        
        if (response.data.signals && response.data.signals.length > 0) {
          response.data.signals.forEach(signal => {
            // Only process signals for this user
            if (signal.toUserId === userId) {
              onCallSignal(signal);
              
              // Update last poll time
              if (signal.timestamp > this.lastPollTime) {
                this.lastPollTime = signal.timestamp;
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to poll call signals:', error);
      }
    }, 2000);
  }

  /**
   * Stop polling for call signals
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Handle accepting a call
   */
  private handleAcceptCall(callNotification: CallNotification) {
    // Emit event for UI to handle
    const event = new CustomEvent('call-accepted', { detail: callNotification });
    window.dispatchEvent(event);
  }

  /**
   * Handle rejecting a call
   */
  private handleRejectCall(callNotification: CallNotification) {
    // Emit event for UI to handle
    const event = new CustomEvent('call-rejected', { detail: callNotification });
    window.dispatchEvent(event);
    
    this.closeNotification(callNotification.callId);
  }

  /**
   * Register call listener
   */
  onCall(listenerId: string, callback: (signal: CallSignal) => void) {
    this.callListeners.set(listenerId, callback);
  }

  /**
   * Unregister call listener
   */
  offCall(listenerId: string) {
    this.callListeners.delete(listenerId);
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopPolling();
    this.closeAllNotifications();
    this.stopRingtone();
    this.callListeners.clear();
  }
}

export const callNotificationService = new CallNotificationService();
