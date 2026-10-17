import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

const AppShell = () => {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Sidebar Navigation (Desktop sidebar & Mobile Drawer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <Topbar />

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 overflow-hidden flex flex-col relative pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (md:hidden) */}
        <BottomNav />
      </div>
    </div>
  );
};

export default AppShell;
