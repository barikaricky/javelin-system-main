import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    console.log('🔍 InstallPromptBanner: Component mounted');
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('📱 Is already installed (standalone):', isStandalone);
    if (isStandalone) {
      console.log('❌ Already installed, not showing banner');
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('installPromptDismissed');
    console.log('🚫 Previously dismissed:', dismissed);
    if (dismissed) {
      console.log('❌ User dismissed before, not showing banner');
      return;
    }

    console.log('✅ Waiting for beforeinstallprompt event...');
    
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎉 beforeinstallprompt event fired!');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show banner after 3 seconds
      console.log('⏳ Showing banner in 3 seconds...');
      setTimeout(() => {
        console.log('✅ Showing install banner now!');
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install');
    } else {
      console.log('❌ User dismissed the install');
    }

    // Hide banner and clear prompt
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom duration-500">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Install Javelin App</h3>
          <p className="text-sm text-blue-100 mb-3">
            Install our app for quick access and offline use!
          </p>
          
          <button
            onClick={handleInstallClick}
            className="w-full py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
}
