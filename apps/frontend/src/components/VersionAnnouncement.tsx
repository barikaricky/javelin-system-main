import { useEffect, useState, useRef, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface VersionAnnouncementProps {
  children: ReactNode;
}

const STORAGE_KEY = 'javelin-version-banner-1-0-1-shown';
const AUTO_HIDE_MS = 6000;
const EXIT_DURATION_MS = 400;

const VersionAnnouncement: React.FC<VersionAnnouncementProps> = ({ children }) => {
  const [shouldRenderBanner, setShouldRenderBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const autoHideTimeoutRef = useRef<number | null>(null);
  const teardownTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasSeen = window.localStorage.getItem(STORAGE_KEY);
    if (hasSeen) {
      return;
    }

    setShouldRenderBanner(true);
    const showTimer = window.setTimeout(() => setIsVisible(true), 50);

    autoHideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      teardownTimeoutRef.current = window.setTimeout(() => setShouldRenderBanner(false), EXIT_DURATION_MS);
    }, AUTO_HIDE_MS);

    window.localStorage.setItem(STORAGE_KEY, 'true');

    return () => {
      window.clearTimeout(showTimer);
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
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className={`relative w-[90%] max-w-md rounded-3xl bg-gradient-to-br from-blue-700 via-slate-900 to-black p-[1px] shadow-[0_20px_45px_-12px_rgba(15,23,42,0.9)] transition-all duration-500 ease-out ${
              isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'
            }`}
          >
            <div className="relative rounded-[calc(1.5rem-4px)] bg-slate-950/95 px-8 py-9 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/25 text-blue-300">
                  <Sparkles className="h-7 w-7 animate-pulse" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-300/80">welcome to</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Javelin Management</h2>
              <p className="mt-2 text-lg font-semibold text-blue-200">Version 1.0.1</p>
              <p className="mt-4 text-sm text-slate-300">
                Discover fresh improvements crafted for your team. Let’s secure every operation together.
              </p>
              <button
                type="button"
                onClick={closeBanner}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Continue
              </button>
            </div>

            <span className="pointer-events-none absolute -top-6 right-10 h-16 w-16 rounded-full bg-blue-500/30 blur-2xl" />
            <span className="pointer-events-none absolute -bottom-10 left-8 h-14 w-14 rounded-full bg-amber-400/25 blur-2xl" />
          </div>
        </div>
      )}
    </>
  );
};

export default VersionAnnouncement;
