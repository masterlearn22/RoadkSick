import React, { useState, useEffect } from 'react';
import { AlertTriangle, Split, Activity, ShieldCheck } from 'lucide-react';
import StatCard from '../common/StatCard';
import { getDashboardStats } from '../../services';

const OverviewStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
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

  const total = stats?.totalDetections ?? 127;
  const longitudinal = stats?.byType?.longitudinal_crack ?? 45;
  const alligator = stats?.byType?.alligator_crack ?? 32;
  const patches = stats?.byType?.patches ?? 18;

  const longitudinalPct = ((longitudinal / total) * 100).toFixed(1);
  const alligatorPct = ((alligator / total) * 100).toFixed(1);
  const patchesPct = ((patches / total) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total Kerusakan */}
      <StatCard
        title="Total Kerusakan"
        value={total}
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        change="+12% bln lalu"
        changeType="increase"
        color="red"
      />

      {/* 2. Longitudinal Crack */}
      <StatCard
        title="Retak Panjang"
        value={longitudinal}
        icon={<Split className="w-5 h-5 text-orange-500" />}
        subtitle={`${longitudinalPct}% total`}
        color="orange"
      />

      {/* 3. Alligator Crack */}
      <StatCard
        title="Retak Buaya"
        value={alligator}
        icon={<Activity className="w-5 h-5 text-amber-500" />}
        subtitle={`${alligatorPct}% total`}
        color="purple"
      />

      {/* 4. Patches */}
      <StatCard
        title="Tambalan"
        value={patches}
        icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
        subtitle={`${patchesPct}% total`}
        color="emerald"
      />
    </div>
  );
};

export default OverviewStats;
