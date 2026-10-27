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

const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-md text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
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
        console.error('Failed to load damage type chart stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [propStats]);

  const { chartData, totalDetections } = useMemo(() => {
    const byType = stats?.byType || {};
    const longitudinal = (byType.longitudinal_crack || 0) + (byType.retak_memanjang || 0);
    const alligator = (byType.alligator_crack || 0) + (byType.retak_buaya || 0);
    const pothole = (byType.pothole || 0) + (byType.jalan_berlubang || 0);
    const rutting = (byType.rutting || 0) + (byType.jalan_tidak_rata || 0);
    const patches = byType.patches || 0;

    const all = [
      { name: 'Retak Memanjang', value: longitudinal, color: '#F59E0B', icon: '🔀' },
      { name: 'Retak Buaya', value: alligator, color: '#DC2626', icon: '🐊' },
      { name: 'Jalan Berlubang', value: pothole, color: '#EF4444', icon: '🕳️' },
      { name: 'Aspal Bergelombang', value: rutting, color: '#8B5CF6', icon: '🛞' },
      { name: 'Tambalan Tidak Rata', value: patches, color: '#3B82F6', icon: '🩹' },
    ];

    const activeItems = all.filter((item) => item.value > 0);
    const total = activeItems.reduce((acc, curr) => acc + curr.value, 0);

    return {
      chartData: activeItems.length > 0 ? activeItems : [{ name: 'Belum Ada Deteksi', value: 1, color: '#CBD5E1', icon: 'ℹ️' }],
      totalDetections: total,
    };
  }, [stats]);

  return (
    <Card
      title="Distribusi Jenis Kerusakan"
      subtitle="Komposisi kerusakan terdeteksi oleh model YOLO11m"
      className={className}
    >
      <div className="relative flex flex-col items-center">
        {/* Donut Chart with Center Text */}
        <div className="relative w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
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

          {/* Center Total Count Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalDetections}
            </span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Total Titik
            </span>
          </div>
        </div>

        {/* Legend below chart */}
        <div className="w-full mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          {chartData.map((item) => {
            const pct =
              totalDetections > 0
                ? ((item.value / totalDetections) * 100).toFixed(1)
                : '0.0';
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-xs flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 truncate flex-1" title={item.name}>
                  {item.icon} {item.name}
                </span>
                <span className="font-semibold text-slate-900 flex-shrink-0">
                  {totalDetections > 0 ? `${item.value} (${pct}%)` : '-'}
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

