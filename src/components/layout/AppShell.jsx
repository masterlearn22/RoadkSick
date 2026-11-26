import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

const AppShell = () => {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50/90 text-slate-900 font-sans antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Topbar />

        <main className="flex-1 overflow-hidden flex flex-col relative pb-[68px] md:pb-0">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

export default AppShell;
