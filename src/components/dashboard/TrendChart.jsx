import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../common/Card';
import { getDashboardStats } from '../../services';

const fallbackTrend = [
  { month: 'Mei', longitudinal_crack: 0, alligator_crack: 0, rutting: 0, patches: 0 },
  { month: 'Jun', longitudinal_crack: 1, alligator_crack: 0, rutting: 0, patches: 0 },
  { month: 'Jul', longitudinal_crack: 2, alligator_crack: 1, rutting: 0, patches: 0 },
  { month: 'Agu', longitudinal_crack: 2, alligator_crack: 1, rutting: 1, patches: 0 },
  { month: 'Sep', longitudinal_crack: 3, alligator_crack: 1, rutting: 1, patches: 1 },
  { month: 'Okt', longitudinal_crack: 4, alligator_crack: 1, rutting: 1, patches: 1 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-md text-xs">
        <p className="font-semibold text-slate-800 mb-2 border-b pb-1">
          Bulan {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900">{entry.value} kasus</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ stats: propStats, className = '' }) => {
  const [stats, setStats] = useState(propStats || null);

  useEffect(() => {
    if (propStats) {
      setStats(propStats);
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
        console.error('Failed to load trend stats:', err);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [propStats]);

  const trendData =
    stats?.monthlyTrend && stats.monthlyTrend.length > 0
      ? stats.monthlyTrend
      : fallbackTrend;

  return (
    <Card
      title="Tren Kerusakan Bulanan"
      subtitle="Perkembangan temuan kondisi jalan 6 bulan terakhir"
      className={className}
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              stroke="#94a3b8"
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              tick={{ fontSize: 12, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="longitudinal_crack"
              name="Retak Memanjang"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#F59E0B' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="alligator_crack"
              name="Retak Buaya"
              stroke="#DC2626"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#DC2626' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="rutting"
              name="Aspal Bergelombang"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#8B5CF6' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="patches"
              name="Tambalan"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#3B82F6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TrendChart;

