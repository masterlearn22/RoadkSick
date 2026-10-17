import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import Card from '../common/Card';

const FilterPanel = ({
  filters = {
    search: '',
    type: 'all',
    severity: 'all',
    mode: 'all',
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
        mode: 'all',
      });
    }
  };

  return (
    <Card className={className} noPadding>
      <div className="p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-white">
        {/* Search input with Lucide Search icon */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Cari jalan, ID deteksi, atau lokasi..."
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Dropdown selects in flex row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Jenis Dropdown */}
          <div className="flex-1 sm:flex-initial">
            <select
              id="filter-type"
              value={filters.type || 'all'}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="pothole">Lubang (Pothole)</option>
              <option value="longitudinal_crack">Retak Memanjang</option>
              <option value="alligator_crack">Retak Buaya</option>
              <option value="rutting">Amblas (Rutting)</option>
              <option value="patches">Tambalan (Patches)</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div className="flex-1 sm:flex-initial">
            <select
              id="filter-severity"
              value={filters.severity || 'all'}
              onChange={(e) => handleChange('severity', e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold cursor-pointer"
            >
              <option value="all">Semua Tingkat</option>
              <option value="high">Tinggi (High)</option>
              <option value="medium">Sedang (Medium)</option>
              <option value="low">Rendah (Low)</option>
            </select>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Reset filter"
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
