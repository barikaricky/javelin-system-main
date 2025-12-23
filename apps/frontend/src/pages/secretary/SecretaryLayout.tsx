import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import SecretarySidebar from '../../components/secretary/SecretarySidebar';
import TopBar from '../../components/TopBar';
import BottomBar from '../../components/BottomBar';

export default function SecretaryLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <SecretarySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-20 lg:pb-0">
          <Outlet />
        </main>
        <BottomBar onMenuClick={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
