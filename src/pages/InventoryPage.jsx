import React, { useState, useEffect, useMemo } from 'react';
import { Download, FileJson, RefreshCw, X, ExternalLink } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import FilterPanel from '../components/inventory/FilterPanel';
import DataTable from '../components/inventory/DataTable';
import Badge from '../components/common/Badge';
import { getAllDetections } from '../services';
import { getDamageTypeConfig } from '../data/damageTypes';
import { formatCoordinate, formatConfidence, formatTimestamp } from '../utils/formatters';
import { SEVERITY_LEVELS, matchesRouteSegment } from '../utils/constants';

const InventoryPage = () => {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    severity: 'all',
    segment: 'all',
  });

  const loadDetections = async () => {
    try {
      setLoading(true);
      const res = await getAllDetections();
      if (res?.success && res.data) {
        setDetections(res.data);
      }
    } catch (err) {
      console.error('Failed to load detection history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getAllDetections();
        if (active && res?.success && res.data) {
          setDetections(res.data);
        }
      } catch (err) {
        console.error('Failed to load detection history:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredDetections = useMemo(() => {
    return detections.filter((item) => {
      if (filters.type && filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }
      if (filters.severity && filters.severity !== 'all' && item.severity !== filters.severity) {
        return false;
      }
      if (!matchesRouteSegment(item.route_segment, filters.segment)) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const loc = (item.location || item.roadName || item.route_segment || '').toLowerCase();
        const id = String(item.id || '').toLowerCase();
        const label = getDamageTypeConfig(item.type).label.toLowerCase();
        if (!loc.includes(q) && !id.includes(q) && !label.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [detections, filters]);

  const handleExportCSV = () => {
    if (filteredDetections.length === 0) return;

    const headers = [
      'ID',
      'Jenis_Kerusakan',
      'Keparahan',
      'Latitude',
      'Longitude',
      'Segmen_Rute',
      'Lokasi',
      'Confidence',
      'Waktu_Deteksi',
    ];

    const rows = filteredDetections.map((d) => {
      const lat = d.coordinates?.lat ?? '';
      const lng = d.coordinates?.lng ?? '';
      return [
        d.id,
        getDamageTypeConfig(d.type).label,
        SEVERITY_LEVELS[d.severity]?.label || d.severity,
        lat,
        lng,
        `"${(d.route_segment || '').replace(/"/g, '""')}"`,
        `"${(d.location || '').replace(/"/g, '""')}"`,
        d.confidence,
        d.timestamp,
      ].join(',');
    });

    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roadsick-jombang-surabaya-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    if (filteredDetections.length === 0) return;

    const geojson = {
      type: 'FeatureCollection',
      features: filteredDetections
        .filter((d) => d.coordinates?.lat != null && d.coordinates?.lng != null)
        .map((d) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(d.coordinates.lng), Number(d.coordinates.lat)],
          },
          properties: {
            id: d.id,
            damage_type: d.type,
            damage_label: getDamageTypeConfig(d.type).label,
            severity: d.severity,
            confidence: d.confidence,
            route_segment: d.route_segment,
            location: d.location,
            timestamp: d.timestamp,
            image_url: d.imageUrl,
          },
        })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roadsick-jombang-surabaya-${Date.now()}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer
      title="Riwayat & Basis Data Deteksi"
      subtitle="Daftar seluruh temuan kerusakan jalan real-time pada koridor Jombang – Surabaya (4 kelas kerusakan)"
      action={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadDetections}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredDetections.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportGeoJSON}
            disabled={filteredDetections.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <FilterPanel filters={filters} onFilterChange={setFilters} />

        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs animate-pulse">
            Memuat riwayat deteksi dari Supabase...
          </div>
        ) : (
          <DataTable
            data={filteredDetections}
            onRowClick={(item) => setSelectedItem(item)}
          />
        )}
      </div>

      {/* Modal Detail Baris Terpilih */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={selectedItem.type} showIcon>
                  {getDamageTypeConfig(selectedItem.type).label}
                </Badge>
                <Badge variant={selectedItem.severity}>
                  {SEVERITY_LEVELS[selectedItem.severity]?.label || selectedItem.severity}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {selectedItem.imageUrl ? (
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                  <img
                    src={selectedItem.imageUrl}
                    alt="Foto Bukti Deteksi"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <span className="text-3xl mb-1">
                    {getDamageTypeConfig(selectedItem.type).icon}
                  </span>
                  <span>Foto bukti tidak dilampirkan</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Segmen Rute
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedItem.route_segment || 'Jombang – Surabaya'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Confidence
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatConfidence(selectedItem.confidence)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Koordinat GPS
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {formatCoordinate(selectedItem.coordinates?.lat, 6)},{' '}
                    {formatCoordinate(selectedItem.coordinates?.lng, 6)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Waktu Deteksi
                  </span>
                  <span className="font-medium text-slate-700">
                    {formatTimestamp(selectedItem.timestamp)}
                  </span>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.coordinates?.lat},${selectedItem.coordinates?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Koordinat di Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default InventoryPage;
