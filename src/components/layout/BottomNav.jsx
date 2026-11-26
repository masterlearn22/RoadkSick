import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Map, History } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Deteksi', path: '/detection', icon: Radio },
  { name: 'Peta GIS', path: '/map', icon: Map },
  { name: 'Riwayat', path: '/inventory', icon: History },
];

const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-1.5 rounded-xl transition-all ${
                      isActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[70px]">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
