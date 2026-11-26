import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { getDashboardStats } from '../../services';
import { formatRelativeTime, formatCoordinate } from '../../utils/formatters';
import { getDamageTypeConfig } from '../../data/damageTypes';

const RecentDetections = ({ recentDetections: propRecent, loading: propLoading, className = '' }) => {
  const [fetchedRecent, setFetchedRecent] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(propRecent === undefined);

  useEffect(() => {
    if (propRecent !== undefined) return;

    let isMounted = true;
    (async () => {
      try {
        const response = await getDashboardStats();
        if (isMounted && response?.success && response.data?.recentDetections) {
          setFetchedRecent(response.data.recentDetections);
        }
      } catch (err) {
        console.error('Failed to load recent detections:', err);
      } finally {
        if (isMounted) setFetchLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [propRecent]);

  const recentList = propRecent !== undefined ? propRecent || [] : fetchedRecent;
  const isLoading = propLoading !== undefined ? propLoading : fetchLoading;

  const renderCoordinates = (coords) => {
    if (!coords) return '-';
    const lat = coords.lat ?? coords.system?.lat ?? (Array.isArray(coords) ? coords[0] : null);
    const lng = coords.lng ?? coords.system?.lng ?? (Array.isArray(coords) ? coords[1] : null);
    if (lat === null || lng === null) return '-';
    return `${formatCoordinate(lat, 5)}, ${formatCoordinate(lng, 5)}`;
  };

  const formatShortId = (id) => {
    if (!id) return '-';
    return String(id).length > 10 ? String(id).slice(0, 8) : id;
  };

  return (
    <Card
      title="Temuan Kerusakan Terbaru"
      subtitle="Rekaman langsung hasil deteksi real-time pada koridor Jombang – Surabaya"
      noPadding
      className={className}
    >
      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-slate-100">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="p-4 space-y-2.5 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          ))
        ) : recentList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Belum ada deteksi tersimpan di database Supabase.
          </div>
        ) : (
          recentList.map((item) => {
            const confPercent = Math.round(
              (item.confidence <= 1 ? item.confidence * 100 : item.confidence) || 0
            );
            const typeConfig = getDamageTypeConfig(item.type);

            return (
              <div key={item.id} className="p-3.5 space-y-2 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={item.type} showIcon>
                    {typeConfig.label}
                  </Badge>
                  <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    #{formatShortId(item.id)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {item.location || item.roadName || 'Koridor Jombang – Surabaya'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 flex-shrink-0 font-mono">
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

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-5 py-3.5">ID</th>
              <th scope="col" className="px-5 py-3.5">Jenis Kerusakan</th>
              <th scope="col" className="px-5 py-3.5">Segmen / Lokasi</th>
              <th scope="col" className="px-5 py-3.5">Koordinat GPS</th>
              <th scope="col" className="px-5 py-3.5">Waktu</th>
              <th scope="col" className="px-5 py-3.5">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 bg-slate-200 rounded w-28" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                </tr>
              ))
            ) : recentList.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                  Belum ada data deteksi terbaru di Supabase.
                </td>
              </tr>
            ) : (
              recentList.map((item) => {
                const confPercent = Math.round(
                  (item.confidence <= 1 ? item.confidence * 100 : item.confidence) || 0
                );
                const typeConfig = getDamageTypeConfig(item.type);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600" title={item.id}>
                      #{formatShortId(item.id)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={item.type} showIcon>
                        {typeConfig.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-semibold">
                      {item.location || item.roadName || 'Koridor Jombang – Surabaya'}
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
                              confPercent >= 85
                                ? 'bg-emerald-500'
                                : confPercent >= 70
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${confPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 text-[11px] font-mono">
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
