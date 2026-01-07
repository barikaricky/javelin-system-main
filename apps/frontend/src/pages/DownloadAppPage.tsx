import { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Check, 
  ChevronDown,
  Shield,
  Zap,
  Globe,
  RefreshCw,
  Wifi,
  Bell
} from 'lucide-react';
import logoImage from '../logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function DownloadAppPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('✅ App is already installed');
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎉 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ App installed successfully!');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    // Debug info
    console.log('🔍 PWA Debug Info:');
    console.log('- Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
    console.log('- Is HTTPS:', window.location.protocol === 'https:');
    console.log('- Is localhost:', window.location.hostname === 'localhost');
    console.log('- Service Worker supported:', 'serviceWorker' in navigator);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const platforms = [
    {
      id: 'android',
      name: 'Android',
      icon: '🤖',
      color: 'from-green-500 to-green-600',
      instructions: [
        'Open this website in Chrome, Edge, or Samsung Internet',
        'Tap the ⋮ menu button (top-right corner)',
        'Select "Add to Home screen" or "Install app"',
        'Confirm installation',
        'Find the app icon on your home screen'
      ]
    },
    {
      id: 'ios',
      name: 'iOS / iPhone / iPad',
      icon: '🍎',
      color: 'from-blue-500 to-blue-600',
      instructions: [
        'Open this website in Safari browser',
        'Tap the Share button (box with arrow pointing up)',
        'Scroll down and tap "Add to Home Screen"',
        'Edit the name if desired, then tap "Add"',
        'App icon will appear on your home screen'
      ]
    },
    {
      id: 'windows',
      name: 'Windows 10/11',
      icon: '🪟',
      color: 'from-sky-500 to-sky-600',
      instructions: [
        'Open this website in Microsoft Edge or Chrome',
        'Click the ⊕ install icon in the address bar (or ⋯ menu → Apps)',
        'Select "Install Javelin Security"',
        'App will open in its own window',
        'Find it in your Start Menu or pin to Taskbar'
      ]
    },
    {
      id: 'mac',
      name: 'macOS',
      icon: '🍏',
      color: 'from-gray-600 to-gray-700',
      instructions: [
        'Open this website in Chrome or Edge',
        'Click the ⊕ install icon in the address bar',
        'Click "Install"',
        'App opens in standalone window',
        'Find it in Applications or Dock'
      ]
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: '🐧',
      color: 'from-purple-500 to-purple-600',
      instructions: [
        'Open this website in Chrome, Edge, or Chromium',
        'Click the ⊕ install icon in the address bar',
        'Click "Install"',
        'App appears in your application menu',
        'Launch from applications or favorites'
      ]
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Optimized performance with instant loading'
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      title: 'Works Offline',
      description: 'Access cached data even without internet'
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Auto Updates',
      description: 'Always get the latest features automatically'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected'
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Push Notifications',
      description: 'Stay updated with instant alerts'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Cross-Platform',
      description: 'Use on any device, anytime, anywhere'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Javelin Security" className="h-12 w-12 rounded-lg object-cover shadow-lg" />
              <div>
                <h1 className="text-white text-xl font-bold">Javelin Security Systems</h1>
                <p className="text-blue-200 text-sm">Professional Security Management</p>
              </div>
            </div>
            <a 
              href="/login"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30 mb-6">
            <Download className="w-5 h-5 text-blue-300" />
            <span className="text-blue-200 font-medium">Progressive Web App</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Install Javelin Security
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              On Any Device
            </span>
          </h2>
          
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Download and install our app on iOS, Android, Windows, macOS, or Linux. 
            No App Store required - install directly from your browser!
          </p>

          {/* One-Click Install Button */}
          {isInstalled ? (
            <div className="mb-8 inline-flex items-center gap-3 px-8 py-4 bg-green-500/20 border-2 border-green-400 rounded-xl">
              <Check className="w-6 h-6 text-green-400" />
              <span className="text-green-400 font-bold text-lg">App Already Installed!</span>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="mb-8 group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 animate-pulse"
            >
              <Download className="w-6 h-6" />
              <span>Install App Now - One Click!</span>
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                Quick Install
              </div>
            </button>
          ) : (
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-blue-500/20 border-2 border-blue-400 rounded-xl text-blue-100 mb-4">
                <Download className="w-6 h-6" />
                <span className="font-semibold">Ready to Install</span>
              </div>
              <p className="text-blue-200 text-sm max-w-2xl mx-auto">
                Follow the instructions below for your device, or look for the install icon (⊕) in your browser's address bar
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Free Installation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>No App Store</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Works Offline</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 text-white">
                {feature.icon}
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-blue-200 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Platform Selection */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-3">
              Installation Instructions
            </h3>
            <p className="text-blue-200">
              Choose your device type below for step-by-step instructions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(selectedPlatform === platform.id ? null : platform.id)}
                className={`relative overflow-hidden rounded-xl p-6 transition-all ${
                  selectedPlatform === platform.id
                    ? 'bg-gradient-to-br ' + platform.color + ' shadow-2xl scale-105'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">{platform.icon}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-white transition-transform ${
                      selectedPlatform === platform.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <h4 className="text-white text-lg font-semibold">{platform.name}</h4>
              </button>
            ))}
          </div>

          {/* Installation Instructions */}
          {selectedPlatform && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 animate-in fade-in slide-in-from-top-4 duration-300">
              {platforms.map((platform) => {
                if (platform.id !== selectedPlatform) return null;
                
                return (
                  <div key={platform.id}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-5xl">{platform.icon}</span>
                      <div>
                        <h4 className="text-white text-2xl font-bold">{platform.name}</h4>
                        <p className="text-blue-200">Installation Instructions</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {platform.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <p className="text-white text-lg pt-1">{instruction}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                      <p className="text-blue-100 text-sm">
                        <strong>Note:</strong> After installation, the app will open in its own window 
                        without browser controls, giving you a native app experience!
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Smartphone className="w-8 h-8 text-white" />
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            {isInstallable 
              ? 'Click the green "Install App Now" button above for instant installation!' 
              : isInstalled
              ? 'App is installed! Sign in to start using it.'
              : 'Follow the instructions above for your device, or sign in now to access the web version instantly.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isInstallable && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg transition-colors shadow-lg flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Install App Now
              </button>
            )}
            <a
              href="/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Sign In Now
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-blue-700 text-white rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors"
            >
              Back to Top
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-16 text-center">
          <p className="text-blue-200 mb-4">
            Need help with installation? Contact your administrator or IT support team.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-blue-300">
            <span>✓ Secure Installation</span>
            <span>✓ No Credit Card Required</span>
            <span>✓ Free Forever</span>
          </div>
        </div>
      </div>
    </div>
  );
}
