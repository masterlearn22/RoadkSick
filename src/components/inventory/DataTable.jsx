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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LayoutGrid,
  Table as TableIcon,
  Image as ImageIcon,
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatCoordinate, formatTimestamp, formatConfidence } from '../../utils/formatters';
import { getDamageTypeConfig } from '../../data/damageTypes';
import { SEVERITY_LEVELS, normalizeSeverity } from '../../utils/constants';

const DataTable = ({
  data = [],
  columns: customColumns,
  onRowClick,
  className = '',
}) => {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'cards' | 'table'

  const defaultColumns = useMemo(
    () => [
      {
        id: 'no',
        header: 'No',
        cell: (info) => (
          <span className="text-slate-400 font-mono text-[11px]">
            {info.row.index + 1}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'type',
        header: 'Jenis Kerusakan',
        cell: (info) => {
          const type = info.getValue();
          const config = getDamageTypeConfig(type);
          return (
            <Badge variant={type} showIcon>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'severity',
        header: 'Keparahan',
        cell: (info) => {
          const norm = normalizeSeverity(info.getValue());
          return (
            <Badge variant={norm}>
              {SEVERITY_LEVELS[norm]?.shortLabel || norm}
            </Badge>
          );
        },
      },
      {
        id: 'location',
        header: 'Segmen / Lokasi',
        accessorFn: (row) =>
          row.route_segment || row.location || row.roadName || 'Jombang – Surabaya',
        cell: (info) => (
          <span className="font-semibold text-slate-800">{info.getValue()}</span>
        ),
      },
      {
        id: 'coordinates',
        header: 'Koordinat GPS',
        accessorFn: (row) => {
          const lat = row.coordinates?.lat ?? row.coordinates?.system?.lat;
          const lng = row.coordinates?.lng ?? row.coordinates?.system?.lng;
          return lat != null && lng != null ? `${lat}, ${lng}` : '-';
        },
        cell: (info) => {
          const row = info.row.original;
          const lat = row.coordinates?.lat ?? row.coordinates?.system?.lat;
          const lng = row.coordinates?.lng ?? row.coordinates?.system?.lng;
          if (lat == null || lng == null) return '-';
          return (
            <span className="font-mono text-slate-600 text-[11px]">
              {formatCoordinate(lat, 5)}, {formatCoordinate(lng, 5)}
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
                    percent >= 85
                      ? 'bg-emerald-500'
                      : percent >= 70
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="font-bold text-slate-700 text-xs font-mono">
                {formatConfidence(val)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: 'Waktu Deteksi',
        cell: (info) => (
          <span className="text-slate-500 whitespace-nowrap text-[11px]">
            {formatTimestamp(info.getValue())}
          </span>
        ),
      },
      {
        id: 'evidence',
        header: 'Bukti',
        enableSorting: false,
        cell: (info) => {
          const hasImage = Boolean(info.row.original.imageUrl);
          return (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                hasImage
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>{hasImage ? 'Foto' : '-'}</span>
            </span>
          );
        },
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
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <span className="text-xs font-bold text-slate-700">
          Menampilkan {startRow}–{endRow} dari {totalRows} Data Deteksi
        </span>

        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[10px]">Kartu</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'table' || viewMode === 'auto'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="text-[10px]">Tabel</span>
          </button>
        </div>
      </div>

      {/* MOBILE CARDS VIEW */}
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
            Tidak ada data riwayat deteksi yang cocok.
          </div>
        ) : (
          paginatedRows.map((row) => {
            const item = row.original;
            const typeConfig = getDamageTypeConfig(item.type);
            const lat = item.coordinates?.lat ?? item.coordinates?.system?.lat;
            const lng = item.coordinates?.lng ?? item.coordinates?.system?.lng;

            return (
              <div
                key={row.id}
                onClick={() => onRowClick && onRowClick(item)}
                className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={item.type} showIcon>
                    {typeConfig.label}
                  </Badge>
                  <Badge variant={item.severity}>
                    {SEVERITY_LEVELS[item.severity]?.shortLabel || item.severity}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-800 font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {item.route_segment || item.location || 'Jombang – Surabaya'}
                  </span>
                  <span className="text-emerald-600 font-mono text-[11px]">
                    {formatConfidence(item.confidence)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                  <span>
                    {lat != null && lng != null
                      ? `${formatCoordinate(lat, 5)}, ${formatCoordinate(lng, 5)}`
                      : '-'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
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
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada data riwayat deteksi yang ditemukan.
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
      <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
        <div className="text-[11px] text-slate-500">
          Halaman <span className="font-bold">{pageIndex + 1}</span> dari{' '}
          <span className="font-bold">{table.getPageCount() || 1}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
