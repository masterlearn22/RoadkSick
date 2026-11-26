import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Gauge, Layers } from 'lucide-react';
import StatCard from '../common/StatCard';
import { getDashboardStats } from '../../services';
import { getDamageTypeConfig } from '../../data/damageTypes';

const OverviewStats = ({ stats: propStats, loading: propLoading }) => {
  const [fetchedStats, setFetchedStats] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(!propStats);

  useEffect(() => {
    if (propStats !== undefined) return;

    let isMounted = true;
    (async () => {
      try {
        const response = await getDashboardStats();
        if (isMounted && response?.success) {
          setFetchedStats(response.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        if (isMounted) setFetchLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [propStats]);

  const stats = propStats !== undefined ? propStats : fetchedStats;
  const isLoading = propLoading !== undefined ? propLoading : fetchLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs animate-pulse"
          >
            <div className="space-y-2.5">
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
  const highSeverityCount = stats?.bySeverity?.high || 0;
  const avgConfPct = stats?.averageConfidence
    ? `${(stats.averageConfidence * 100).toFixed(1)}%`
    : '0.0%';

  // Hitung kelas kerusakan paling dominan
  const byType = stats?.byType || {};
  const entries = Object.entries(byType).filter(([, count]) => count > 0);
  const dominantEntry =
    entries.length > 0
      ? entries.sort((a, b) => b[1] - a[1])[0]
      : ['pothole', 0];
  const dominantConfig = getDamageTypeConfig(dominantEntry[0]);
  const dominantCount = dominantEntry[1] || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="Total Kerusakan"
        value={total}
        icon={<AlertTriangle className="w-5 h-5 text-blue-600" />}
        subtitle="Koridor Jombang – Surabaya"
        change={total > 0 ? 'Supabase Live' : 'Belum ada data'}
        changeType="increase"
        color="blue"
      />

      <StatCard
        title="Kondisi Berat"
        value={highSeverityCount}
        icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
        subtitle={
          total > 0
            ? `${((highSeverityCount / total) * 100).toFixed(1)}% prioritas tinggi`
            : 'Belum ada temuan'
        }
        color="red"
      />

      <StatCard
        title="Akurasi Keyakinan"
        value={avgConfPct}
        icon={<Gauge className="w-5 h-5 text-emerald-600" />}
        subtitle="Rata-rata skor YOLO"
        color="emerald"
      />

      <StatCard
        title="Kelas Dominan"
        value={dominantCount}
        icon={<Layers className="w-5 h-5 text-amber-600" />}
        subtitle={total > 0 ? dominantConfig.label : 'Menunggu survei'}
        color="amber"
      />
    </div>
  );
};

export default OverviewStats;
