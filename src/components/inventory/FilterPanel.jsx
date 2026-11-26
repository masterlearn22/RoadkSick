import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import Card from '../common/Card';
import { OFFICIAL_DAMAGE_TYPES } from '../../data/damageTypes';
import { ROUTE_SEGMENTS } from '../../utils/constants';

const FilterPanel = ({
  filters = {
    search: '',
    type: 'all',
    severity: 'all',
    segment: 'all',
  },
  onFilterChange,
  className = '',
}) => {
  const handleChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    }
  };

  const handleReset = () => {
    if (onFilterChange) {
      onFilterChange({
        search: '',
        type: 'all',
        severity: 'all',
        segment: 'all',
      });
    }
  };

  return (
    <Card className={className} noPadding>
      <div className="p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 bg-white">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Cari jalan, segmen, jenis kerusakan, atau ID..."
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="filter-type"
            value={filters.type || 'all'}
            onChange={(e) => handleChange('type', e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold cursor-pointer"
          >
            <option value="all">Semua 4 Kelas</option>
            {OFFICIAL_DAMAGE_TYPES.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.label}
              </option>
            ))}
          </select>

          <select
            id="filter-segment"
            value={filters.segment || 'all'}
            onChange={(e) => handleChange('segment', e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold cursor-pointer"
          >
            <option value="all">Semua Segmen</option>
            {ROUTE_SEGMENTS.map((seg) => (
              <option key={seg.value} value={seg.value}>
                {seg.value}
              </option>
            ))}
          </select>

          <select
            id="filter-severity"
            value={filters.severity || 'all'}
            onChange={(e) => handleChange('severity', e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold cursor-pointer"
          >
            <option value="all">Semua Keparahan</option>
            <option value="high">Berat / Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Ringan / Rendah</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Reset Filter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </Card>
  );
};

export default FilterPanel;
