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
import { OFFICIAL_DAMAGE_TYPES } from '../../data/damageTypes';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg text-xs">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
          Bulan {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900">{entry.value} titik</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ stats: propStats, className = '' }) => {
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
        console.error('Failed to load trend stats:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [propStats]);

  const stats = propStats !== undefined ? propStats : fetchedStats;
  const trendData = stats?.monthlyTrend || [];

  return (
    <Card
      title="Tren Temuan Kerusakan"
      subtitle="Perkembangan pencatatan 4 kelas kerusakan 6 bulan terakhir"
      className={className}
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
            />
            {OFFICIAL_DAMAGE_TYPES.map((cls) => (
              <Line
                key={cls.id}
                type="monotone"
                dataKey={cls.id}
                name={cls.shortLabel}
                stroke={cls.color}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: cls.color }}
                activeDot={{ r: 5.5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TrendChart;
