import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Map,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  Route,
  Database,
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Deteksi Real-Time', path: '/detection', icon: Radio, badge: 'Live' },
  { name: 'Peta Web GIS', path: '/map', icon: Map, badge: 'GIS' },
  { name: 'Riwayat Deteksi', path: '/inventory', icon: History, badge: null },
];

const Sidebar = () => {
  const location = useLocation();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const isMockMode = useAppStore((state) => state.isMockMode ?? false);

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/55 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80 flex flex-col h-full transition-all duration-300 shadow-2xl md:shadow-none select-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${sidebarOpen ? 'w-64' : 'md:w-20'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <NavLink
            to="/dashboard"
            onClick={() => {
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Route className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-slate-900 text-base leading-tight tracking-tight flex items-center gap-1.5">
                  RoadSick
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/70 px-1.5 py-0.2 rounded-md font-bold uppercase">
                    GIS
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  Rute Jombang – Surabaya
                </span>
              </div>
            )}
          </NavLink>

          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden transition-colors cursor-pointer"
              title="Tutup Menu"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
          {sidebarOpen && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Utama
            </div>
          )}

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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge === 'Live'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                            : 'bg-slate-100 text-slate-600'
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

        {/* Footer / Database & Thesis Info */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${
              isMockMode
                ? 'bg-amber-50/90 border border-amber-200/80 text-amber-900'
                : 'bg-emerald-50/90 border border-emerald-200/80 text-emerald-900'
            } ${!sidebarOpen ? 'justify-center px-1' : ''}`}
          >
            <div className="relative flex items-center justify-center flex-shrink-0">
              <Database
                className={`w-4 h-4 ${
                  isMockMode ? 'text-amber-600' : 'text-emerald-600'
                }`}
              />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col text-xs leading-none min-w-0">
                <span className="font-bold flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMockMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  {isMockMode ? 'Mode Simulasi' : 'Supabase Live'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 truncate">
                  {isMockMode ? 'Data Dummy Lokal' : 'PostgreSQL & Storage Aktif'}
                </span>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div className="px-2 py-1 text-[10px] text-slate-400 leading-relaxed">
              <div className="font-semibold text-slate-500">Skripsi D4 TI UNAIR</div>
              <div>Real-Time YOLO • Web GIS</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
