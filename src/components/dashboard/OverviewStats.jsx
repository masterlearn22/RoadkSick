import React, { useState, useEffect } from 'react';
import { AlertTriangle, Split, Activity, ShieldCheck } from 'lucide-react';
import StatCard from '../common/StatCard';
import { getDashboardStats } from '../../services';

const OverviewStats = ({ stats: propStats, loading: propLoading }) => {
  const [stats, setStats] = useState(propStats || null);
  const [loading, setLoading] = useState(propStats ? false : true);

  useEffect(() => {
    if (propStats) {
      setStats(propStats);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        if (isMounted && response?.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [propStats]);

  const isLoading = propLoading !== undefined ? propLoading : loading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-7 bg-slate-200 rounded w-2/3" />
              <div className="h-2.5 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const total = stats?.totalDetections || 0;
  const longitudinal = (stats?.byType?.longitudinal_crack || 0) + (stats?.byType?.retak_memanjang || 0);
  const alligator = (stats?.byType?.alligator_crack || 0) + (stats?.byType?.retak_buaya || 0);
  const pothole = (stats?.byType?.pothole || 0) + (stats?.byType?.jalan_berlubang || 0);
  const rutting = (stats?.byType?.rutting || 0) + (stats?.byType?.jalan_tidak_rata || 0) + (stats?.byType?.patches || 0);

  const calcPct = (count) => (total > 0 ? ((count / total) * 100).toFixed(1) : '0.0');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total Kerusakan */}
      <StatCard
        title="Total Kerusakan"
        value={total}
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        subtitle="Surabaya – Jombang"
        change={total > 0 ? `${total} titik live` : 'Belum ada data'}
        changeType="increase"
        color="red"
      />

      {/* 2. Longitudinal Crack */}
      <StatCard
        title="Retak Memanjang"
        value={longitudinal}
        icon={<Split className="w-5 h-5 text-orange-500" />}
        subtitle={`${calcPct(longitudinal)}% total`}
        color="orange"
      />

      {/* 3. Alligator Crack */}
      <StatCard
        title="Retak Buaya"
        value={alligator}
        icon={<Activity className="w-5 h-5 text-rose-500" />}
        subtitle={`${calcPct(alligator)}% total`}
        color="purple"
      />

      {/* 4. Aspal Bergelombang / Lubang */}
      <StatCard
        title={pothole > 0 ? 'Jalan Berlubang' : 'Aspal Rusak / Tambalan'}
        value={pothole > 0 ? pothole : rutting}
        icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
        subtitle={`${calcPct(pothole > 0 ? pothole : rutting)}% total`}
        color={pothole > 0 ? 'red' : 'emerald'}
      />
    </div>
  );
};

export default OverviewStats;

