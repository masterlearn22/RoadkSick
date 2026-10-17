import React from 'react';
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

const trendData = [
  { month: 'Jul', pothole: 8, crack: 10, rutting: 2 },
  { month: 'Agu', pothole: 12, crack: 14, rutting: 4 },
  { month: 'Sep', pothole: 10, crack: 11, rutting: 3 },
  { month: 'Okt', pothole: 15, crack: 16, rutting: 5 },
  { month: 'Nov', pothole: 11, crack: 13, rutting: 4 },
  { month: 'Des', pothole: 14, crack: 18, rutting: 6 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md text-xs">
        <p className="font-semibold text-gray-800 mb-2 border-b pb-1">
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
              <span className="font-bold text-gray-900">{entry.value} kasus</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ className = '' }) => {
  return (
    <Card
      title="Tren Kerusakan Bulanan"
      subtitle="Perkembangan temuan kondisi jalan 6 bulan terakhir (Jul - Des)"
      className={className}
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tickLine={false}
              stroke="#9CA3AF"
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#9CA3AF"
              tick={{ fontSize: 12, fill: '#6B7280' }}
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
              dataKey="pothole"
              name="Pothole"
              stroke="#EF4444"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#EF4444' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="crack"
              name="Cracks"
              stroke="#F97316"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#F97316' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="rutting"
              name="Rutting"
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
