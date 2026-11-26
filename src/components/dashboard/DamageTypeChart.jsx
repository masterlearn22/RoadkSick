import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../common/Card';
import { getDashboardStats } from '../../services';
import { OFFICIAL_DAMAGE_TYPES } from '../../data/damageTypes';

const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-lg text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span>{data.icon}</span>
          <span>{data.name}</span>
        </div>
        <p className="mt-1 text-slate-600">
          Jumlah: <span className="font-bold text-slate-900">{data.value}</span> ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const DamageTypeChart = ({ stats: propStats, className = '' }) => {
  const [fetchedStats, setFetchedStats] = useState(null);

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
        console.error('Failed to load damage type chart stats:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [propStats]);

  const stats = propStats !== undefined ? propStats : fetchedStats;

  const { chartData, legendItems, totalDetections } = useMemo(() => {
    const byType = stats?.byType || {};
    const items = OFFICIAL_DAMAGE_TYPES.map((cls) => ({
      id: cls.id,
      name: cls.label,
      value: byType[cls.id] || 0,
      color: cls.color,
      icon: cls.icon,
    }));

    const activeItems = items.filter((item) => item.value > 0);
    const total = activeItems.reduce((acc, curr) => acc + curr.value, 0);

    return {
      chartData:
        activeItems.length > 0
          ? activeItems
          : [{ name: 'Belum Ada Deteksi', value: 1, color: '#E2E8F0', icon: 'ℹ️' }],
      legendItems: items,
      totalDetections: total,
    };
  }, [stats]);

  return (
    <Card
      title="Distribusi 4 Kelas Kerusakan"
      subtitle="Proporsi hasil klasifikasi real-time YOLO (Rute Jombang – Surabaya)"
      className={className}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative w-full h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip total={totalDetections} />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totalDetections}
            </span>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Total Titik
            </span>
          </div>
        </div>

        <div className="w-full mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2.5 text-xs">
          {legendItems.map((item) => {
            const pct =
              totalDetections > 0
                ? ((item.value / totalDetections) * 100).toFixed(1)
                : '0.0';
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 border border-slate-100"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700 font-semibold truncate flex-1" title={item.name}>
                  {item.icon} {item.name}
                </span>
                <span className="font-mono font-bold text-slate-900 flex-shrink-0 text-[11px]">
                  {item.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default DamageTypeChart;
