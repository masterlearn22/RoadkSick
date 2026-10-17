import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ScanLine, Map, TableProperties } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Deteksi AI', path: '/detection', icon: ScanLine },
  { name: 'Peta GIS', path: '/map', icon: Map },
  { name: 'Inventori & RMSE', path: '/inventory', icon: TableProperties },
];

const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none">
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
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-1 rounded-xl transition-all ${
                      isActive ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-transform duration-200" />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
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
