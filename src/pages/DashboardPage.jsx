import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Radio, Map, ArrowRight, Cpu, Route } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import OverviewStats from '../components/dashboard/OverviewStats';
import DamageTypeChart from '../components/dashboard/DamageTypeChart';
import TrendChart from '../components/dashboard/TrendChart';
import RecentDetections from '../components/dashboard/RecentDetections';
import { getDashboardStats } from '../services';
import { BENCHMARK_YOLO_MODELS, ROUTE_SEGMENTS } from '../utils/constants';

const DashboardPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getDashboardStats();
        if (isMounted && res?.success) {
          setDashboardStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data from Supabase:', err);
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  };

  const actionButton = (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
      title="Perbarui Data Dashboard"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
      <span>{isRefreshing ? 'Memuat...' : 'Segarkan'}</span>
    </button>
  );

  return (
    <PageContainer
      title="Ringkasan Pemetaan Kerusakan Jalan"
      subtitle="Analisis Real-Time Object Detection Algoritma YOLO Berbasis Web GIS — Studi Kasus Rute Jombang – Surabaya (±90 km)"
      action={actionButton}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-slate-900/15 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-bold text-sky-200">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Real-Time Camera Stream & Web Geolocation API</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
                Sistem Inspeksi Jalan Koridor Jombang – Surabaya
              </h3>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
                Menjalankan deteksi real-time 4 kelas kerusakan jalan (Jalan Berlubang, Jalan Tidak Rata, Retak Buaya, dan Retak Memanjang) dengan pemetaan koordinat otomatis ke peta interaktif Leaflet.js.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-shrink-0">
              <Link
                to="/detection"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-900 hover:bg-blue-50 active:scale-95 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all"
              >
                <Radio className="w-4 h-4 text-rose-600" />
                <span>Mulai Deteksi Real-Time</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/map"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 font-bold text-xs sm:text-sm rounded-2xl transition-all"
              >
                <Map className="w-4 h-4 text-sky-300" />
                <span>Peta Web GIS</span>
              </Link>
            </div>
          </div>

          {/* Strip Konteks Penelitian */}
          <div className="relative z-10 mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300 flex-wrap">
              <Cpu className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span className="font-bold text-white">Komparasi 6 YOLO Nano:</span>
              {BENCHMARK_YOLO_MODELS.map((m) => (
                <span
                  key={m.id}
                  className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-slate-200 font-mono text-[10px]"
                >
                  {m.name}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-slate-300 flex-wrap md:justify-end">
              <Route className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-bold text-white">3 Tahapan Lapangan:</span>
              {ROUTE_SEGMENTS.slice(0, 3).map((seg) => (
                <span
                  key={seg.value}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 text-[10px] font-semibold"
                >
                  {seg.stage}: {seg.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 1. Overview Stats Cards */}
        <OverviewStats stats={dashboardStats} loading={isRefreshing} />

        {/* 2. Grid Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DamageTypeChart stats={dashboardStats} />
          <TrendChart stats={dashboardStats} />
        </div>

        {/* 3. Recent Detections List */}
        <RecentDetections
          recentDetections={dashboardStats?.recentDetections}
          loading={isRefreshing}
        />
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
