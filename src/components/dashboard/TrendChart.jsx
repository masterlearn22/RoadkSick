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
  { month: 'Jul', longitudinal_crack: 8, alligator_crack: 6, rutting: 4, patches: 3 },
  { month: 'Agu', longitudinal_crack: 12, alligator_crack: 9, rutting: 5, patches: 4 },
  { month: 'Sep', longitudinal_crack: 10, alligator_crack: 7, rutting: 4, patches: 3 },
  { month: 'Okt', longitudinal_crack: 15, alligator_crack: 11, rutting: 6, patches: 5 },
  { month: 'Nov', longitudinal_crack: 11, alligator_crack: 8, rutting: 5, patches: 4 },
  { month: 'Des', longitudinal_crack: 14, alligator_crack: 10, rutting: 7, patches: 6 },
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
              stroke="#EF4444"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#EF4444' }}
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
