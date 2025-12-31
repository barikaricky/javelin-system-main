import { useEffect, useState, useRef, ReactNode } from 'react';
import { Sparkles, Users, Shield, UserCog, MapPin, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface FeatureAnnouncementProps {
  children: ReactNode;
}

const STORAGE_KEY = 'javelin-version-banner-1-0-2-shown';
const AUTO_HIDE_MS = 10000;
const EXIT_DURATION_MS = 400;

const FeatureAnnouncement: React.FC<FeatureAnnouncementProps> = ({ children }) => {
  const [shouldRenderBanner, setShouldRenderBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const autoHideTimeoutRef = useRef<number | null>(null);
  const teardownTimeoutRef = useRef<number | null>(null);
  const { user } = useAuthStore();

  const features = [
    { icon: Users, text: 'View All Supervisors', color: 'from-purple-500 to-purple-600' },
    { icon: Shield, text: 'Manage General Supervisors', color: 'from-indigo-500 to-indigo-600' },
    { icon: UserCog, text: 'Monitor Managers', color: 'from-blue-500 to-blue-600' },
    { icon: MapPin, text: 'Assign Operators to Locations', color: 'from-emerald-500 to-emerald-600' },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasSeen = window.localStorage.getItem(STORAGE_KEY);
    if (hasSeen) {
      return;
    }

    // Delay showing announcement slightly for better UX
    const initialDelay = window.setTimeout(() => {
      setShouldRenderBanner(true);
      const showTimer = window.setTimeout(() => setIsVisible(true), 50);
      
      return () => window.clearTimeout(showTimer);
    }, 800);

    autoHideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      teardownTimeoutRef.current = window.setTimeout(() => setShouldRenderBanner(false), EXIT_DURATION_MS);
    }, AUTO_HIDE_MS);

    window.localStorage.setItem(STORAGE_KEY, 'true');

    return () => {
      window.clearTimeout(initialDelay);
      if (autoHideTimeoutRef.current !== null) {
        window.clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = null;
      }
      if (teardownTimeoutRef.current !== null) {
        window.clearTimeout(teardownTimeoutRef.current);
        teardownTimeoutRef.current = null;
      }
    };
  }, []);

  // Animate features sequentially
  useEffect(() => {
    if (!shouldRenderBanner || !isVisible) return;

    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % features.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [shouldRenderBanner, isVisible, features.length]);

  const closeBanner = () => {
    if (!shouldRenderBanner) {
      return;
    }
    setIsVisible(false);
    if (autoHideTimeoutRef.current !== null) {
      window.clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined') {
      teardownTimeoutRef.current = window.setTimeout(() => {
        setShouldRenderBanner(false);
        teardownTimeoutRef.current = null;
      }, EXIT_DURATION_MS);
    }
  };

  return (
    <>
      {children}
      {shouldRenderBanner && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md transition-opacity duration-500 px-4 ${
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeBanner}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-3xl bg-gradient-to-br from-purple-600 via-blue-700 to-indigo-900 p-[2px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] transition-all duration-700 ease-out ${
              isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-90 opacity-0'
            }`}
          >
            <div className="relative rounded-[calc(1.5rem-2px)] bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12">
              {/* Header */}
              <div className="mb-6 flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50 animate-pulse">
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <p className="text-xs sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.35em] text-purple-300/90 mb-2">
                  🎉 new update
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white text-center">
                  Javelin Management
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-purple-500"></div>
                  <p className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Version 1.0.2
                  </p>
                  <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-purple-500"></div>
                </div>
              </div>

              {/* Feature Highlight */}
              <div className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/30 rounded-2xl p-4 sm:p-6 border border-purple-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 flex-shrink-0" />
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
                      Enhanced Secretary Management
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                    Powerful new tools for comprehensive personnel oversight and streamlined operations.
                  </p>

                  {/* Animated Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      const isActive = index === featureIndex;
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                            isActive
                              ? 'bg-gradient-to-r ' + feature.color + ' scale-105 shadow-lg'
                              : 'bg-slate-800/50 scale-100'
                          }`}
                        >
                          <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${
                            isActive ? 'bg-white/20' : 'bg-slate-700/50'
                          } transition-all duration-500`}>
                            <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'} transition-colors duration-500`} />
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold ${
                            isActive ? 'text-white' : 'text-slate-400'
                          } transition-colors duration-500`}>
                            {feature.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* User Greeting */}
              {user && (
                <div className="mb-6 text-center">
                  <p className="text-xs sm:text-sm text-slate-400">
                    Welcome back, <span className="font-semibold text-purple-400">{user.firstName}</span>
                  </p>
                </div>
              )}

              {/* CTA Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={closeBanner}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 px-8 sm:px-10 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-purple-900/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-900/60 focus:outline-none focus:ring-4 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Let's Go
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </button>
              </div>
            </div>

            {/* Decorative Blobs */}
            <span className="pointer-events-none absolute -top-8 right-8 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-purple-500/40 blur-3xl animate-pulse"></span>
            <span className="pointer-events-none absolute -bottom-12 left-8 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-500/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></span>
            <span className="pointer-events-none absolute top-1/2 -right-8 h-16 w-16 rounded-full bg-emerald-400/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></span>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureAnnouncement;
