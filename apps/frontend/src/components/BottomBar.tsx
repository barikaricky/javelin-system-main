import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, Bars3Icon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface BottomBarProps {
  onMenuClick: () => void;
}

export default function BottomBar({ onMenuClick }: BottomBarProps) {
  const location = useLocation();

  const tabs = [
    { name: 'Home', icon: HomeIcon, path: '/dashboard' },
    { name: 'Menu', icon: Bars3Icon, path: '#', onClick: onMenuClick },
    { name: 'Approvals', icon: ClipboardDocumentCheckIcon, path: '/approvals', badge: 5 },
  ];

  return (
    <nav className="bottom-bar lg:hidden fixed bottom-0 left-0 right-0 h-14 sm:h-16">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        if (tab.onClick) {
          return (
            <button
              key={tab.name}
              onClick={tab.onClick}
              className="bottom-bar-tab bottom-bar-tab-inactive"
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs">{tab.name}</span>
            </button>
          );
        }

        return (
          <Link
            key={tab.name}
            to={tab.path}
            className={`bottom-bar-tab ${
              isActive ? 'bottom-bar-tab-active' : 'bottom-bar-tab-inactive'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              {tab.badge && (
                <span className="absolute -top-2 -right-2 bg-error text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
