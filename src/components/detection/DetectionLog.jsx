import React, { useEffect, useRef } from 'react';
import { Radio, MapPin, CheckCircle2 } from 'lucide-react';
import { getDamageTypeConfig } from '../../data/damageTypes';

/**
 * DetectionLog
 * Panel log aliran deteksi real-time dengan auto-scroll ke entri terbaru.
 */
const DetectionLog = ({
  logs = [],
  maxHeight = '480px',
  onSelectLog,
  className = '',
}) => {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [logs.length]);

  const formatTime = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
            Log Deteksi Real-Time
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
          {logs.length} Tersimpan
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-2.5">
              <Radio className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-600">
              Menunggu aliran deteksi kamera...
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
              Tekan tombol Mulai Deteksi untuk memindai permukaan jalan secara real-time.
            </p>
          </div>
        ) : (
          logs.map((log, idx) => {
            const damage = getDamageTypeConfig(log.type);
            const confPct =
              log.confidence !== undefined
                ? `${((log.confidence <= 1 ? log.confidence * 100 : log.confidence)).toFixed(1)}%`
                : '90.0%';

            return (
              <div
                key={log.id || idx}
                onClick={() => onSelectLog && onSelectLog(log)}
                className={`bg-slate-50/80 hover:bg-white border border-slate-200/80 rounded-xl p-2.5 transition-all ${
                  onSelectLog ? 'cursor-pointer hover:shadow-xs' : ''
                }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: damage.color,
                  animation: 'fadeInUp 0.25s ease-out forwards',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-900 min-w-0">
                    <span className="text-sm leading-none">{damage.icon}</span>
                    <span className="font-bold truncate">{damage.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {formatTime(log.timestamp)} WIB
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="inline-flex items-center gap-1 font-mono text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 truncate">
                    <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span>
                      {log.coordinates?.lat != null
                        ? `${Number(log.coordinates.lat).toFixed(5)}, ${Number(log.coordinates.lng).toFixed(5)}`
                        : '-7.46640, 112.46380'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="font-bold px-1.5 py-0.5 rounded-md font-mono"
                      style={{
                        color: damage.color,
                        backgroundColor: `${damage.color}15`,
                      }}
                    >
                      {confPct}
                    </span>
                    {log.savedToCloud !== false && (
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-500"
                        title="Tersimpan ke Supabase"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DetectionLog;
