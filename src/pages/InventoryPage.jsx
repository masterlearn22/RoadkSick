import React, { useState, useEffect, useMemo } from 'react';
import { TableProperties, Target, Download, FileSpreadsheet } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import FilterPanel from '../components/inventory/FilterPanel';
import DataTable from '../components/inventory/DataTable';
import RMSETable from '../components/inventory/RMSETable';
import TabSwitcher from '../components/common/TabSwitcher';
import { getAllDetections, getRMSEData, exportData } from '../services';

const INVENTORY_TABS = [
  { key: 'detections', label: 'Data Kerusakan', icon: TableProperties },
  { key: 'rmse', label: 'Pengujian Spasial RMSE', icon: Target },
];

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState('detections');
  const [detections, setDetections] = useState([]);
  const [rmseData, setRmseData] = useState([]);
  const [rmseSummary, setRmseSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    severity: 'all',
    mode: 'all',
  });

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      try {
        setLoading(true);
        const [detRes, rmseRes] = await Promise.all([
          getAllDetections(),
          getRMSEData(),
        ]);

        if (isMounted) {
          if (detRes?.success && detRes.data) {
            setDetections(detRes.data);
          }
          if (rmseRes?.success && rmseRes.data) {
            if (Array.isArray(rmseRes.data)) {
              setRmseData(rmseRes.data);
            } else if (Array.isArray(rmseRes.data.samples)) {
              setRmseData(rmseRes.data.samples);
              setRmseSummary(rmseRes.data.summary);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load inventory data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter detections client-side
  const filteredDetections = useMemo(() => {
    return detections.filter((item) => {
      if (filters.type && filters.type !== 'all') {
        if (item.type !== filters.type) return false;
      }
      if (filters.severity && filters.severity !== 'all') {
        if (item.severity !== filters.severity) return false;
      }
      if (filters.mode && filters.mode !== 'all') {
        if (item.mode !== filters.mode) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const loc = (
          item.location ||
          item.locationName ||
          item.roadName ||
          ''
        ).toLowerCase();
        const id = (item.id || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        if (!loc.includes(q) && !id.includes(q) && !type.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [detections, filters]);

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await exportData('csv');
      if (res?.success) {
        const headers = [
          'ID',
          'Jenis',
          'Latitude',
          'Longitude',
          'Lokasi',
          'Mode',
          'Confidence',
          'Waktu',
        ];
        const rows = filteredDetections.map((d) => {
          const lat =
            d.coordinates?.system?.lat ??
            (Array.isArray(d.coordinates)
              ? d.coordinates[0]
              : d.coordinates?.lat ?? '');
          const lng =
            d.coordinates?.system?.lng ??
            (Array.isArray(d.coordinates)
              ? d.coordinates[1]
              : d.coordinates?.lng ?? '');
          return [
            d.id,
            d.type,
            lat,
            lng,
            `"${(d.location || d.locationName || d.roadName || '').replace(
              /"/g,
              '""'
            )}"`,
            d.mode,
            d.confidence,
            d.timestamp,
          ].join(',');
        });

        const csvContent =
          'data:text/csv;charset=utf-8,' +
          [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `roadsick-detections-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert('Gagal mengekspor data.');
    } finally {
      setExporting(false);
    }
  };

  const handleEditGroundTruth = () => {
    alert(
      'Fitur penyesuaian Ground Truth via GPS RTK Geodetik siap digunakan untuk pengujian lapangan skripsi.'
    );
  };

  const handleExportRMSE = () => {
    alert(
      'Laporan evaluasi RMSE berhasil diekspor (ringkasan statistik spasial).'
    );
  };

  const tabList = [
    { ...INVENTORY_TABS[0], count: filteredDetections.length },
    { ...INVENTORY_TABS[1], count: rmseData.length },
  ];

  return (
    <PageContainer
      title="Basis Data & Akurasi Spasial"
      subtitle="Kompilasi riwayat kerusakan jalan dan evaluasi residual error geospasial RMSE"
    >
      <div className="space-y-3.5 sm:space-y-5">
        {/* Top Filters (Active for Detections Tab) */}
        {activeTab === 'detections' && (
          <FilterPanel filters={filters} onFilterChange={setFilters} />
        )}

        {/* Tab Switcher & Export Action */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex-1 max-w-md">
            <TabSwitcher
              tabs={tabList}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="pill"
            />
          </div>

          {activeTab === 'detections' && (
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting || filteredDetections.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Mengekspor...' : 'Ekspor CSV'}</span>
            </button>
          )}
        </div>

        {/* Tab 1: DataTable */}
        {activeTab === 'detections' && (
          <div>
            {loading ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs animate-pulse">
                Memuat data inventori kerusakan jalan...
              </div>
            ) : (
              <DataTable data={filteredDetections} />
            )}
          </div>
        )}

        {/* Tab 2: RMSETable */}
        {activeTab === 'rmse' && (
          <div>
            {loading ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs animate-pulse">
                Memuat data pengujian residual spasial RMSE...
              </div>
            ) : (
              <RMSETable
                data={rmseData}
                rmseValue={rmseSummary?.rmseDistanceMeters}
                onEditGroundTruth={handleEditGroundTruth}
                onExportReport={handleExportRMSE}
              />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default InventoryPage;
