import React from 'react';
import {
  Info,
  FileDown,
  Calculator,
  Target,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';
import { formatCoordinate } from '../../utils/formatters';

const RMSETable = ({
  data = [],
  rmseValue,
  onEditGroundTruth,
  onExportReport,
  className = '',
}) => {
  // Calculate stats
  const count = data.length;
  const sumD2 = data.reduce((acc, curr) => {
    const val = curr.distanceSquared ?? Math.pow(curr.distance || 0, 2);
    return acc + Number(val || 0);
  }, 0);

  const calculatedRMSE = count > 0 ? Math.sqrt(sumD2 / count).toFixed(3) : '0.000';
  const effectiveRMSE = rmseValue !== undefined ? rmseValue : calculatedRMSE;

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* 1. Mobile & Desktop Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-extrabold text-sm text-blue-950 mb-0.5">
            Pengujian Akurasi Posisi Spasial (RMSE Testing)
          </p>
          <p className="text-blue-800 text-[11px] sm:text-xs">
            Evaluasi Root Mean Square Error (RMSE) membandingkan koordinat sistem ponsel
            (<span className="font-bold">System</span>) terhadap koordinat ukur teliti lapangan
            (<span className="font-bold">Ground Truth</span>). Standar akurasi skripsi ini menargetkan toleransi horizontal &lt; 5.0 meter.
          </p>
        </div>
      </div>

      {/* 2. Three Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Rumus */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            <span>Rumus Uji Spasial</span>
          </div>
          <div className="mt-2 text-sm sm:text-base font-mono font-black text-slate-900 bg-slate-50 p-2 rounded-xl text-center border border-slate-200">
            RMSE = √(Σdᵢ² / n)
          </div>
          <p className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500">
            dᵢ = Jarak Euclidean sistem vs ground truth
          </p>
        </div>

        {/* Card 2: Jumlah Titik */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-blue-600" />
            <span>Jumlah Titik Uji (n)</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{count}</span>
            <span className="text-xs text-slate-500 font-semibold">titik validasi</span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500">
            Tersebar di koridor jalan Kota Bandung
          </p>
        </div>

        {/* Card 3: Nilai RMSE */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-blue-200 shadow-2xs bg-gradient-to-br from-white to-blue-50/50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hasil Akhir RMSE</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{effectiveRMSE}</span>
            <span className="text-xs text-blue-700 font-bold">Meter</span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            ✓ Presisi Sangat Baik (&lt; 5m)
          </p>
        </div>
      </div>

      {/* 3. Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            Tabel Evaluasi Titik Ground Truth
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Detail koordinat dan residual error per titik sampel
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onExportReport && onExportReport()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor Laporan RMSE</span>
          </button>
        </div>
      </div>

      {/* 4. MOBILE CARDS VIEW (< md) */}
      <div className="md:hidden divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {data.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Belum ada data pengujian RMSE
          </div>
        ) : (
          data.map((row, idx) => {
            const sysLat = row.system?.lat ?? (Array.isArray(row.system) ? row.system[0] : '-');
            const sysLng = row.system?.lng ?? (Array.isArray(row.system) ? row.system[1] : '-');
            const gtLat = row.groundTruth?.lat ?? (Array.isArray(row.groundTruth) ? row.groundTruth[0] : '-');
            const gtLng = row.groundTruth?.lng ?? (Array.isArray(row.groundTruth) ? row.groundTruth[1] : '-');
            const distance = Number(row.distance || 0).toFixed(2);
            const distanceSq = Number(row.distanceSquared ?? Math.pow(row.distance || 0, 2)).toFixed(3);

            return (
              <div key={row.id || idx} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {row.id}
                  </span>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-sans block leading-none">
                      Selisih Jarak (d)
                    </span>
                    <span className="text-sm font-black text-amber-600 font-mono">
                      {distance} m
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans font-semibold">
                      Sistem (Ponsel/AI)
                    </span>
                    <span className="text-slate-700">
                      {formatCoordinate(sysLat, 5)}, {formatCoordinate(sysLng, 5)}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-600 block text-[10px] font-sans font-semibold">
                      Ground Truth (Ukur)
                    </span>
                    <span className="text-emerald-700">
                      {formatCoordinate(gtLat, 5)}, {formatCoordinate(gtLng, 5)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>d² = {distanceSq} m²</span>
                  <span className="text-[10px] text-slate-400">Titik #{idx + 1}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. DESKTOP TABLE VIEW (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3.5 text-center">No</th>
                <th scope="col" className="px-4 py-3.5">ID Titik</th>
                <th scope="col" className="px-4 py-3.5 font-mono">System Lat</th>
                <th scope="col" className="px-4 py-3.5 font-mono">System Lng</th>
                <th scope="col" className="px-4 py-3.5 font-mono">Ground Truth Lat</th>
                <th scope="col" className="px-4 py-3.5 font-mono">Ground Truth Lng</th>
                <th scope="col" className="px-4 py-3.5 text-right">Selisih (m)</th>
                <th scope="col" className="px-4 py-3.5 text-right">d² (m²)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    Belum ada data pengujian RMSE
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const sysLat = row.system?.lat ?? (Array.isArray(row.system) ? row.system[0] : '-');
                  const sysLng = row.system?.lng ?? (Array.isArray(row.system) ? row.system[1] : '-');
                  const gtLat = row.groundTruth?.lat ?? (Array.isArray(row.groundTruth) ? row.groundTruth[0] : '-');
                  const gtLng = row.groundTruth?.lng ?? (Array.isArray(row.groundTruth) ? row.groundTruth[1] : '-');
                  const distance = Number(row.distance || 0).toFixed(2);
                  const distanceSq = Number(row.distanceSquared ?? Math.pow(row.distance || 0, 2)).toFixed(4);

                  return (
                    <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">
                        {row.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {formatCoordinate(sysLat, 6)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {formatCoordinate(sysLng, 6)}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-700 font-medium">
                        {formatCoordinate(gtLat, 6)}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-700 font-medium">
                        {formatCoordinate(gtLng, 6)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-right text-amber-600">
                        {distance}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-right text-slate-800">
                        {distanceSq}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Footer with RMSE summary */}
            <tfoot className="bg-blue-50/80 border-t-2 border-blue-200 font-bold text-blue-900">
              <tr>
                <td colSpan="6" className="px-4 py-3 text-right uppercase tracking-wider text-[11px]">
                  Nilai Evaluasi Spasial RMSE Total:
                </td>
                <td colSpan="2" className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-blue-700">RMSE =</span>
                    <span className="font-mono text-base font-black text-blue-700 px-3 py-0.5 bg-blue-100 rounded-lg">
                      {effectiveRMSE} m
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RMSETable;
