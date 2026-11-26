import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const routeTitles = {
  '/dashboard': {
    title: 'Dashboard Survei',
    subtitle: 'Ringkasan Kondisi Jalan Koridor Jombang – Surabaya',
  },
  '/detection': {
    title: 'Deteksi Real-Time YOLO',
    subtitle: 'Aliran Kamera Langsung & Web Geolocation API',
  },
  '/map': {
    title: 'Peta Web GIS',
    subtitle: 'Sebaran Spasial 4 Kelas Kerusakan Jalan',
  },
  '/inventory': {
    title: 'Riwayat Deteksi',
    subtitle: 'Basis Data Temuan Kerusakan Permukaan Jalan',
  },
};

const Topbar = () => {
  const location = useLocation();
  const isMockMode = useAppStore((state) => state.isMockMode ?? false);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  const currentPath = location.pathname;
  let pageInfo = routeTitles[currentPath];
  if (!pageInfo) {
    const matchedKey = Object.keys(routeTitles).find((key) =>
      currentPath.startsWith(key)
    );
    pageInfo = matchedKey
      ? routeTitles[matchedKey]
      : { title: 'RoadSick Web GIS', subtitle: 'Deteksi Jalan Real-Time' };
  }

  return (
    <header className="h-14 sm:h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 z-20 flex-shrink-0 sticky top-0">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          type="button"
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors active:scale-95 cursor-pointer"
          title="Buka Navigasi"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight truncate">
            {pageInfo.title}
          </h1>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate hidden xs:block">
            {pageInfo.subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            isMockMode
              ? 'bg-amber-50 text-amber-700 border border-amber-200/90'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/90'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isMockMode ? 'bg-amber-400' : 'bg-emerald-400'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isMockMode ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="hidden sm:inline">
            {isMockMode ? 'Mode Simulasi' : 'Supabase Live'}
          </span>
          <span className="sm:hidden">{isMockMode ? 'Mock' : 'Live'}</span>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            SD
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-none">
              Surya Dwi Satria
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 font-medium">
              D4 TI • UNAIR 2026
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
