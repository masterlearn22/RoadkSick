import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ScanLine, Map, ArrowRight, Sparkles } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import OverviewStats from '../components/dashboard/OverviewStats';
import DamageTypeChart from '../components/dashboard/DamageTypeChart';
import TrendChart from '../components/dashboard/TrendChart';
import RecentDetections from '../components/dashboard/RecentDetections';
import { getDashboardStats } from '../services';

const DashboardPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setIsRefreshing(true);
        const res = await getDashboardStats();
        if (isMounted && res?.success) {
          setDashboardStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data from Supabase:', err);
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const actionButton = (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
      title="Perbarui Data Dashboard dari Supabase"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
      <span className="hidden xs:inline">{isRefreshing ? 'Memuat...' : 'Segarkan'}</span>
    </button>
  );

  return (
    <PageContainer
      title="Ringkasan Survei Spasial"
      subtitle="Monitoring kondisi kerusakan jalan raya di koridor Surabaya – Krian – Mojokerto – Jombang (YOLO11m & Uji Spasial RMSE)"
      action={actionButton}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile Quick Action Hero Card */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-lg shadow-blue-500/15 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Model AI Siaga Lapangan</span>
              </div>
              <h3 className="text-base sm:text-xl font-black tracking-tight leading-snug">
                Siap Melakukan Pemetaan Jalan Hari Ini?
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-md">
                Gunakan kamera ponsel cerdas Anda sebagai sensor deteksi kerusakan permukaan jalan koridor Surabaya – Jombang secara real-time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <Link
                to="/detection"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
              >
                <ScanLine className="w-4 h-4" />
                <span>Mulai Deteksi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/map"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-800/60 hover:bg-blue-800/80 active:scale-95 border border-white/20 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                <Map className="w-4 h-4" />
                <span>Peta GIS</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 1. Overview Stats Cards */}
        <OverviewStats stats={dashboardStats} loading={isRefreshing} />

        {/* 2. Grid Charts side-by-side */}
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

