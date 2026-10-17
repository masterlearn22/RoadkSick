import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Percent, CheckCircle2 } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { getDashboardStats } from '../../services';
import { formatRelativeTime, formatCoordinate } from '../../utils/formatters';
import { DAMAGE_TYPES } from '../../data/damageTypes';

const RecentDetections = ({ className = '' }) => {
  const [recentList, setRecentList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadRecent = async () => {
      try {
        const response = await getDashboardStats();
        if (isMounted && response?.success && response.data?.recentDetections) {
          setRecentList(response.data.recentDetections.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load recent detections:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRecent();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderCoordinates = (coords) => {
    if (!coords) return '-';
    let lat = -6.917;
    let lng = 107.619;
    if (coords.system) {
      lat = coords.system.lat;
      lng = coords.system.lng;
    } else if (Array.isArray(coords)) {
      lat = coords[0];
      lng = coords[1];
    } else if (coords.lat !== undefined) {
      lat = coords.lat;
      lng = coords.lng;
    }
    return `${formatCoordinate(lat, 5)}, ${formatCoordinate(lng, 5)}`;
  };

  return (
    <Card
      title="Titik Deteksi Terakhir"
      subtitle="5 titik kerusakan jalan terverifikasi sistem YOLOv8"
      noPadding
      className={className}
    >
      {/* 1. MOBILE CARD VIEW (< md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="p-4 space-y-2.5 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-20" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          ))
        ) : recentList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Belum ada deteksi terbaru
          </div>
        ) : (
          recentList.map((item) => {
            const confPercent = Math.round(
              (item.confidence <= 1 ? item.confidence * 100 : item.confidence) || 0
            );
            const typeConfig = DAMAGE_TYPES[item.type] || {
              label: item.type,
              icon: '⚠️',
              color: '#3B82F6',
            };

            return (
              <div
                key={item.id}
                className="p-3.5 space-y-2 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={item.type} showIcon>
                    {typeConfig.label}
                  </Badge>
                  <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {item.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {item.location || item.roadName || 'Kota Bandung'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 flex-shrink-0">
                    {confPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                  <span>{renderCoordinates(item.coordinates)}</span>
                  <span className="text-slate-400 font-sans">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. DESKTOP TABLE VIEW (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-5 py-3.5">ID</th>
              <th scope="col" className="px-5 py-3.5">Jenis Kerusakan</th>
              <th scope="col" className="px-5 py-3.5">Lokasi Jalan</th>
              <th scope="col" className="px-5 py-3.5">Koordinat (Lat, Lng)</th>
              <th scope="col" className="px-5 py-3.5">Waktu</th>
              <th scope="col" className="px-5 py-3.5">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 bg-slate-200 rounded w-24" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                </tr>
              ))
            ) : recentList.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                  Belum ada data deteksi terbaru
                </td>
              </tr>
            ) : (
              recentList.map((item) => {
                const confPercent = Math.round(
                  (item.confidence <= 1 ? item.confidence * 100 : item.confidence) || 0
                );
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                      {item.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={item.type} showIcon>
                        {DAMAGE_TYPES[item.type]?.label || item.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-semibold">
                      {item.location || item.roadName || 'Kota Bandung'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {renderCoordinates(item.coordinates)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(item.timestamp)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              confPercent >= 90
                                ? 'bg-emerald-500'
                                : confPercent >= 80
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${confPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 text-[11px] min-w-8">
                          {confPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RecentDetections;
