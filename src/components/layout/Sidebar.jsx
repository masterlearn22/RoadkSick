import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  Map,
  TableProperties,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Compass,
  Layers,
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Deteksi AI', path: '/detection', icon: ScanLine, badge: 'YOLOv8' },
  { name: 'Peta GIS', path: '/map', icon: Map, badge: 'Live' },
  { name: 'Inventori & RMSE', path: '/inventory', icon: TableProperties, badge: null },
];

const Sidebar = () => {
  const location = useLocation();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const isMockMode = useAppStore((state) => state.isMockMode ?? true);

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col h-full transition-all duration-300 shadow-xl md:shadow-none select-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${sidebarOpen ? 'w-64' : 'md:w-20'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-slate-50/50">
          <NavLink
            to="/dashboard"
            onClick={() => {
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-slate-900 text-base leading-tight tracking-tight flex items-center gap-1.5">
                  RoadSick
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold uppercase">
                    GIS
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  YOLOv8 & RMSE Field
                </span>
              </div>
            )}
          </NavLink>

          {/* Close button on mobile / Collapse button on desktop */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
              title="Tutup Menu"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={sidebarOpen ? 'Kecilkan Sidebar' : 'Perbesar Sidebar'}
              type="button"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                title={!sidebarOpen ? item.name : undefined}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-98 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-blue-500/80 text-white'
                            : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Status Mode */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          {isMockMode && (
            <div
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 ${
                !sidebarOpen ? 'justify-center px-1' : ''
              }`}
            >
              <div className="relative flex items-center justify-center flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="absolute w-4 h-4 rounded-full bg-emerald-400/40 animate-ping" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col text-xs leading-none">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    Simulasi Aktif
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                  </span>
                  <span className="text-[10px] text-emerald-700/90 mt-0.5">
                    Model YOLOv8 Mock Data
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
