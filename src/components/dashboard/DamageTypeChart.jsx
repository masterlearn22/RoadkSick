import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../common/Card';

const chartData = [
  { name: 'Pothole', value: 45, color: '#EF4444', icon: '🕳️' },
  { name: 'Longitudinal Crack', value: 32, color: '#F97316', icon: '🔀' },
  { name: 'Alligator Crack', value: 25, color: '#EAB308', icon: '🐊' },
  { name: 'Rutting', value: 15, color: '#3B82F6', icon: '🛞' },
  { name: 'Patches', value: 10, color: '#22C55E', icon: '🩹' },
];

const totalDetections = chartData.reduce((acc, curr) => acc + curr.value, 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.value / totalDetections) * 100).toFixed(1);
    return (
      <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-md text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-gray-900">
          <span>{data.icon}</span>
          <span>{data.name}</span>
        </div>
        <p className="mt-1 text-gray-600">
          Jumlah: <span className="font-bold text-gray-900">{data.value}</span> ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const DamageTypeChart = ({ className = '' }) => {
  return (
    <Card
      title="Distribusi Jenis Kerusakan"
      subtitle="Komposisi kerusakan terdeteksi oleh model YOLOv8"
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
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total Count Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {totalDetections}
            </span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Titik
            </span>
          </div>
        </div>

        {/* Legend below chart */}
        <div className="w-full mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          {chartData.map((item) => {
            const pct = ((item.value / totalDetections) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-xs flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600 truncate flex-1" title={item.name}>
                  {item.icon} {item.name}
                </span>
                <span className="font-semibold text-gray-900 flex-shrink-0">
                  {pct}%
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
