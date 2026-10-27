import React, { useState } from 'react';
import { X, Target, Plus, Download, CheckCircle2, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { updateGroundTruth, upsertGroundTruth } from '../../services';
import { haversineDistance } from '../../utils/coordinates';

const RMSEModal = ({
  isOpen,
  onClose,
  rmseSamples = [],
  summary = null,
  detections = [],
  onDataUpdated,
}) => {
  if (!isOpen) return null;

  const [selectedDamageId, setSelectedDamageId] = useState('');
  const [sampleCode, setSampleCode] = useState('');
  const [gtLat, setGtLat] = useState('');
  const [gtLng, setGtLng] = useState('');
  const [phoneLat, setPhoneLat] = useState('');
  const [phoneLng, setPhoneLng] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle selecting a detection to prefill form
  const handleSelectDamage = (e) => {
    const id = e.target.value;
    setSelectedDamageId(id);
    if (!id) return;

    const det = detections.find((d) => d.id === id);
    if (det) {
      const lat = det.coordinates?.system?.lat ?? det.coordinates?.[0] ?? det.latitude ?? 0;
      const lng = det.coordinates?.system?.lng ?? det.coordinates?.[1] ?? det.longitude ?? 0;
      // Default sample code
      setSampleCode(`GT-${det.id.slice(-4).toUpperCase()}`);
      // Default ground truth near system coords with slight offset
      setGtLat(lat.toFixed(6));
      setGtLng(lng.toFixed(6));
      setFieldNotes(`Pengukuran pita ukur/GPS geodetik di ${det.location || det.roadName || 'Jalur Survei'}`);
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDamageId || !gtLat || !gtLng) {
      setErrorMsg('Harap lengkapi titik kerusakan dan koordinat Ground Truth.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        damage_id: selectedDamageId,
        sample_code: sampleCode,
        ground_truth_lat: parseFloat(gtLat),
        ground_truth_lng: parseFloat(gtLng),
        phone_gps_lat: phoneLat ? parseFloat(phoneLat) : null,
        phone_gps_lng: phoneLng ? parseFloat(phoneLng) : null,
        field_notes: fieldNotes,
      };

      if (typeof upsertGroundTruth === 'function') {
        await upsertGroundTruth(payload);
      } else {
        await updateGroundTruth(selectedDamageId, [payload.ground_truth_lat, payload.ground_truth_lng]);
      }

      setSuccessMsg('Data Ground Truth berhasil disimpan dan RMSE diperbarui!');
      if (onDataUpdated) onDataUpdated();

      // Reset form
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data ground truth.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV for Thesis Chapter 4
  const handleExportCSV = () => {
    if (!rmseSamples || rmseSamples.length === 0) return;

    const headers = [
      'No',
      'Kode Sampel',
      'ID Deteksi',
      'Sistem Lat (GNSS Smartwatch)',
      'Sistem Lng (GNSS Smartwatch)',
      'Ground Truth Lat (Aktual)',
      'Ground Truth Lng (Aktual)',
      'Error Jarak (m)',
      'Kuadrat Error (m^2)',
      'GPS HP Lat (Pembanding)',
      'GPS HP Lng (Pembanding)',
      'Catatan Lapangan',
    ];

    const rows = rmseSamples.map((s, idx) => [
      idx + 1,
      s.sampleCode || s.id,
      s.detectionId || '-',
      s.sysLat ?? s.system?.lat ?? '',
      s.sysLng ?? s.system?.lng ?? '',
      s.gtLat ?? s.groundTruth?.lat ?? '',
      s.gtLng ?? s.groundTruth?.lng ?? '',
      (s.distance ?? s.error_distance_m ?? 0).toFixed(3),
      (s.distanceSquared ?? s.squared_error_m2 ?? 0).toFixed(4),
      s.phoneLat ?? '',
      s.phoneLng ?? '',
      `"${(s.fieldNotes || '').replace(/"/g, '""')}"`,
    ]);

    const overallRMSE = summary?.overallRMSE ?? summary?.rmseDistanceMeters ?? 0;
    rows.push([]);
    rows.push(['Ringkasan', `Total Sampel: ${rmseSamples.length}`, `Nilai RMSE (m): ${overallRMSE.toFixed(3)}`, `Target: < 3.00 m`]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `evaluasi_spasial_rmse_roadsick_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentRMSE = summary?.overallRMSE ?? summary?.rmseDistanceMeters ?? 0;
  const meetsTarget = currentRMSE > 0 && currentRMSE < 3.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Validasi Lapangan & Pengujian Spasial RMSE
              </h3>
              <p className="text-[11px] text-slate-500">
                Pengukuran deviasi jarak spasial GNSS Smartwatch Supercalla Onyx terhadap Ground Truth aktual
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Sampel Ground Truth
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {rmseSamples.length} <span className="text-xs font-normal text-slate-500">titik uji</span>
              </span>
            </div>

            <div className={`border rounded-2xl p-3.5 ${meetsTarget ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Nilai Akurasi Spasial RMSE
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black ${meetsTarget ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {currentRMSE.toFixed(3)}
                </span>
                <span className="text-xs font-bold text-slate-600">meter</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Status Standar Presisi
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                {meetsTarget ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Memenuhi Target (&lt; 3.0 m)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Target: &lt; 3.00 meter
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form Input Ground Truth */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Input / Update Koordinat Ground Truth Lapangan</span>
            </h4>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pilih Titik Kerusakan */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Pilih Titik Deteksi Kerusakan:
                  </label>
                  <select
                    value={selectedDamageId}
                    onChange={handleSelectDamage}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium"
                    required
                  >
                    <option value="">-- Pilih Titik Kerusakan --</option>
                    {detections.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} - {d.type} ({d.location || d.roadName || 'Koridor'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kode Sampel */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Kode Sampel Riset (Bab 4):
                  </label>
                  <input
                    type="text"
                    value={sampleCode}
                    onChange={(e) => setSampleCode(e.target.value)}
                    placeholder="Contoh: SBY-MJK-001"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Koordinat Ground Truth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Ground Truth Latitude (Hasil Ukur Aktual):
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={gtLat}
                    onChange={(e) => setGtLat(e.target.value)}
                    placeholder="-7.466400"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Ground Truth Longitude (Hasil Ukur Aktual):
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={gtLng}
                    onChange={(e) => setGtLng(e.target.value)}
                    placeholder="112.433800"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Optional GPS HP & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    GPS HP Lat (Opsional Pembanding):
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={phoneLat}
                    onChange={(e) => setPhoneLat(e.target.value)}
                    placeholder="-7.466500"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    GPS HP Lng (Opsional Pembanding):
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={phoneLng}
                    onChange={(e) => setPhoneLng(e.target.value)}
                    placeholder="112.433900"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Catatan Lapangan:
                  </label>
                  <input
                    type="text"
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    placeholder="Kondisi cuaca / posisi marka"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Ground Truth & Hitung RMSE'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Table of RMSE Evaluation Samples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Daftar Titik Pengujian Spasial Lapangan
              </h4>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Tabel RMSE (CSV)</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Kode</th>
                      <th className="p-2.5">Koordinat Sistem (GNSS)</th>
                      <th className="p-2.5">Ground Truth (Aktual)</th>
                      <th className="p-2.5 text-right">Error (m)</th>
                      <th className="p-2.5 text-right">Kuadrat (m²)</th>
                      <th className="p-2.5">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {rmseSamples.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          Belum ada sampel ground truth yang diinput. Silakan tambahkan melalui form di atas.
                        </td>
                      </tr>
                    ) : (
                      rmseSamples.map((s, idx) => {
                        const dist = s.distance ?? s.error_distance_m ?? 0;
                        const distSq = s.distanceSquared ?? s.squared_error_m2 ?? dist * dist;
                        const sysLat = s.sysLat ?? s.system?.lat ?? 0;
                        const sysLng = s.sysLng ?? s.system?.lng ?? 0;
                        const gtLatVal = s.gtLat ?? s.groundTruth?.lat ?? 0;
                        const gtLngVal = s.gtLng ?? s.groundTruth?.lng ?? 0;

                        return (
                          <tr key={s.id || idx} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-800">{s.sampleCode || s.id}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              {sysLat.toFixed(5)}, {sysLng.toFixed(5)}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              {gtLatVal.toFixed(5)}, {gtLngVal.toFixed(5)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-red-600">
                              {dist.toFixed(2)} m
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500">
                              {distSq.toFixed(3)}
                            </td>
                            <td className="p-2.5 text-slate-500 text-[11px] max-w-[150px] truncate">
                              {s.fieldNotes || s.field_notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            RoadSick Spatial RMSE Evaluation • Studi Kasus Rute Surabaya – Mojokerto – Jombang
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default RMSEModal;
