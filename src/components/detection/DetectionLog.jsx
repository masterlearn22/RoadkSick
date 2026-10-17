import React, { useEffect, useRef } from 'react';
import { DAMAGE_TYPES } from '../../data/damageTypes';

/**
 * DetectionLog
 * Streaming real-time detection event log panel with auto-scroll.
 *
 * @param {Array} logs - List of logs [{ id, type, confidence, coordinates: { lat, lng }, timestamp }]
 * @param {string} maxHeight - Max height string, e.g., '480px' or 'h-96'
 */
const DetectionLog = ({
  logs = [],
  maxHeight = '520px',
  className = '',
}) => {
  const scrollContainerRef = useRef(null);

  // Auto-scroll to bottom whenever a new log entry arrives
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs]);

  const formatTime = (ts) => {
    if (!ts) return '';
    if (typeof ts === 'string') return ts;
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/75 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-gray-800 text-sm">
            Log Deteksi Real-Time
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Total: {logs.length}
        </span>
      </div>

      {/* Log list container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-2.5 scroll-smooth divide-y divide-transparent"
      >
        {logs.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-gray-400 p-6">
            <span className="text-3xl mb-2">📡</span>
            <p className="text-xs font-medium text-gray-500">
              Menunggu aliran deteksi aktif...
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Tekan &quot;Mulai Deteksi&quot; untuk menjalankan streaming YOLOv8
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const damage = DAMAGE_TYPES[log.type] || {
              label: log.type,
              color: '#EF4444',
              icon: '⚠️',
            };

            const borderColors = {
              pothole: 'border-l-red-500',
              longitudinal_crack: 'border-l-orange-500',
              alligator_crack: 'border-l-yellow-500',
              rutting: 'border-l-blue-500',
              patches: 'border-l-green-500',
            };

            const borderColorClass =
              borderColors[log.type] || 'border-l-blue-500';

            return (
              <div
                key={log.id}
                className={`bg-gray-50/80 hover:bg-white border border-gray-200/90 border-l-4 ${borderColorClass} rounded-lg p-2.5 shadow-xs transition-all duration-300 transform translate-y-0 opacity-100`}
                style={{
                  animation: 'fadeInUp 0.35s ease-out forwards',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-xs text-gray-900">
                    <span className="text-sm leading-none">{damage.icon}</span>
                    <span className="font-semibold">{damage.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {formatTime(log.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="font-mono text-[11px] text-gray-600 bg-white/80 px-1.5 py-0.5 rounded border border-gray-200">
                    📍 {log.coordinates?.lat?.toFixed(5) || '-6.91700'},{' '}
                    {log.coordinates?.lng?.toFixed(5) || '107.61900'}
                  </div>
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: damage.color,
                      backgroundColor: `${damage.color}15`,
                    }}
                  >
                    {log.confidence !== undefined
                      ? `${(log.confidence * 100).toFixed(1)}%`
                      : '95%'}
                  </span>
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
