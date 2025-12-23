import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Hide default navbar on mobile since sidebar has profile */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar handles both desktop (visible) and mobile (toggle) */}
        <Sidebar />
        
        {/* Main content - no bottom padding needed anymore */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
