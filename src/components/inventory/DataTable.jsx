import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Radio,
  Video,
  Camera,
  MapPin,
  Calendar,
  Layers,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatCoordinate, formatTimestamp, formatConfidence } from '../../utils/formatters';
import { DAMAGE_TYPES } from '../../data/damageTypes';

const defaultModeIcons = {
  realtime: { icon: Radio, label: 'Real-time' },
  video: { icon: Video, label: 'Video' },
  image: { icon: Camera, label: 'Image' },
};

const DataTable = ({
  data = [],
  columns: customColumns,
  onRowClick,
  className = '',
}) => {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'cards' | 'table'

  // Default Column Definitions
  const defaultColumns = useMemo(
    () => [
      {
        id: 'no',
        header: 'No',
        cell: (info) => info.row.index + 1,
        enableSorting: false,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => (
          <span className="font-mono font-bold text-blue-600">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Jenis Kerusakan',
        cell: (info) => {
          const type = info.getValue();
          const config = DAMAGE_TYPES[type] || { label: type };
          return (
            <Badge variant={type} showIcon>
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: 'coordinates',
        header: 'Koordinat',
        accessorFn: (row) => {
          if (row.coordinates?.system) {
            return `${row.coordinates.system.lat}, ${row.coordinates.system.lng}`;
          }
          if (Array.isArray(row.coordinates)) {
            return `${row.coordinates[0]}, ${row.coordinates[1]}`;
          }
          if (row.coordinates?.lat !== undefined) {
            return `${row.coordinates.lat}, ${row.coordinates.lng}`;
          }
          return '-';
        },
        cell: (info) => {
          const row = info.row.original;
          let lat = null;
          let lng = null;
          if (row.coordinates?.system) {
            lat = row.coordinates.system.lat;
            lng = row.coordinates.system.lng;
          } else if (Array.isArray(row.coordinates)) {
            lat = row.coordinates[0];
            lng = row.coordinates[1];
          } else if (row.coordinates?.lat !== undefined) {
            lat = row.coordinates.lat;
            lng = row.coordinates.lng;
          }
          if (lat === null || lng === null) return '-';
          return (
            <span className="font-mono text-slate-600 text-[11px]">
              {formatCoordinate(lat, 5)}, {formatCoordinate(lng, 5)}
            </span>
          );
        },
      },
      {
        id: 'location',
        header: 'Lokasi Jalan',
        accessorFn: (row) =>
          row.location || row.locationName || row.roadName || 'Koridor Surabaya – Mojokerto – Jombang',
        cell: (info) => (
          <span className="font-semibold text-slate-800">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'mode',
        header: 'Mode',
        cell: (info) => {
          const mode = info.getValue() || 'image';
          const infoObj = defaultModeIcons[mode] || { icon: Camera, label: mode };
          const Icon = infoObj.icon;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span className="capitalize text-[11px] font-medium">{infoObj.label}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: (info) => {
          const val = info.getValue();
          const percent = Math.round((val <= 1 ? val * 100 : val) || 0);
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    percent >= 90
                      ? 'bg-emerald-500'
                      : percent >= 80
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="font-bold text-slate-700 text-xs">
                {formatConfidence(val)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: 'Waktu',
        cell: (info) => (
          <span className="text-slate-500 whitespace-nowrap text-[11px]">
            {formatTimestamp(info.getValue())}
          </span>
        ),
      },
    ],
    []
  );

  const columns = customColumns || defaultColumns;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const totalRows = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  const paginatedRows = table.getRowModel().rows;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden ${className}`}
    >
      {/* Table / Card Header Controls */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <span className="text-xs font-bold text-slate-700">
          Menampilkan {startRow} - {endRow} dari {totalRows} Data Kerusakan
        </span>

        {/* View Toggle on Mobile */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
              viewMode === 'cards' || (viewMode === 'auto' && window.innerWidth < 768)
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tampilan Kartu (Mobile)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[10px]">Kartu</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
              viewMode === 'table' || (viewMode === 'auto' && window.innerWidth >= 768)
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tampilan Tabel"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="text-[10px]">Tabel</span>
          </button>
        </div>
      </div>

      {/* 1. MOBILE CARDS VIEW */}
      <div
        className={`${
          viewMode === 'table'
            ? 'hidden'
            : viewMode === 'cards'
            ? 'block'
            : 'block md:hidden'
        } divide-y divide-slate-100`}
      >
        {paginatedRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada data yang cocok dengan kriteria
          </div>
        ) : (
          paginatedRows.map((row) => {
            const item = row.original;
            const typeConfig = DAMAGE_TYPES[item.type] || {
              label: item.type,
              color: '#3B82F6',
            };
            const mode = item.mode || 'image';
            const ModeIcon = defaultModeIcons[mode]?.icon || Camera;

            return (
              <div
                key={row.id}
                onClick={() => onRowClick && onRowClick(item)}
                className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={item.type} showIcon>
                    {typeConfig.label}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {item.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-800 font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {item.location || item.roadName || 'Koridor Surabaya – Mojokerto – Jombang'}
                  </span>
                  <span className="text-emerald-600 font-mono text-[11px]">
                    {formatConfidence(item.confidence)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                  <span>
                    {item.coordinates?.system
                      ? `${item.coordinates.system.lat.toFixed(5)}, ${item.coordinates.system.lng.toFixed(5)}`
                      : Array.isArray(item.coordinates)
                      ? `${item.coordinates[0].toFixed(5)}, ${item.coordinates[1].toFixed(5)}`
                      : '-'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-sans">
                    <ModeIcon className="w-3 h-3 text-slate-500" />
                    <span className="capitalize">{mode}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. DESKTOP / EXPLICIT TABLE VIEW */}
      <div
        className={`${
          viewMode === 'cards'
            ? 'hidden'
            : viewMode === 'table'
            ? 'block'
            : 'hidden md:block'
        } overflow-x-auto`}
      >
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] select-none">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      onClick={header.column.getToggleSortingHandler()}
                      className={`px-4 py-3.5 ${
                        canSort ? 'cursor-pointer hover:bg-slate-100/80' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {canSort && (
                          <span className="text-slate-400">
                            {sortDirection === 'asc' ? (
                              '▲'
                            ) : sortDirection === 'desc' ? (
                              '▼'
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
        <div className="text-[11px] text-slate-500">
          Halaman <span className="font-bold">{pageIndex + 1}</span> dari{' '}
          <span className="font-bold">{table.getPageCount() || 1}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
