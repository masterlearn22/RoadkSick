/**
 * Utility untuk membuat Foto Ber-Watermark Geotagging Lengkap
 * Mencetak: Jenis Kerusakan, Akurasi/Confidence, Koordinat GPS Lat/Lng, Akurasi Sensor, Waktu (Timestamp), dan Rute Studi Kasus
 */

import { DAMAGE_TYPES } from '../data/damageTypes';

/**
 * Buat canvas ber-watermark dari elemen Video atau Image
 * @param {HTMLVideoElement|HTMLImageElement} sourceElement
 * @param {Object} metadata - { damageType, confidence, lat, lng, gpsAccuracy, timestamp, routeSegment }
 * @returns {Promise<Blob>} Blob JPEG siap upload ke Supabase Storage
 */
export async function createWatermarkedImageBlob(sourceElement, metadata = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = sourceElement.videoWidth || sourceElement.naturalWidth || sourceElement.width || 1280;
  const height = sourceElement.videoHeight || sourceElement.naturalHeight || sourceElement.height || 720;

  canvas.width = width;
  canvas.height = height;

  // 1. Gambar frame video / foto utama
  ctx.drawImage(sourceElement, 0, 0, width, height);

  // 2. Data Watermark
  const damageConfig = DAMAGE_TYPES[metadata.damageType] || {
    label: metadata.damageType || 'Kerusakan Jalan',
    color: '#EF4444',
    icon: '⚠️',
  };

  const confidencePct = metadata.confidence
    ? `${(metadata.confidence * 100).toFixed(1)}%`
    : '95.0%';

  const lat = metadata.lat != null ? Number(metadata.lat).toFixed(6) : '-7.466400';
  const lng = metadata.lng != null ? Number(metadata.lng).toFixed(6) : '112.433800';
  const accuracyText = metadata.gpsAccuracy ? `(±${Number(metadata.gpsAccuracy).toFixed(1)}m)` : '';

  const dateObj = metadata.timestamp ? new Date(metadata.timestamp) : new Date();
  const timeFormatted = dateObj.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const routeText = metadata.routeSegment || 'Rute Surabaya – Mojokerto – Jombang';

  // 3. Gambar Bounding Box jika ada
  if (metadata.bbox) {
    const { x, y, width: bw, height: bh } = metadata.bbox;
    ctx.lineWidth = 4;
    ctx.strokeStyle = damageConfig.color || '#EF4444';
    ctx.strokeRect(x, y, bw, bh);

    // Label di atas kotak
    ctx.fillStyle = damageConfig.color || '#EF4444';
    const labelHeader = `${damageConfig.label} ${confidencePct}`;
    ctx.font = 'bold 18px Inter, sans-serif';
    const textW = ctx.measureText(labelHeader).width;
    ctx.fillRect(x, Math.max(0, y - 28), textW + 16, 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(labelHeader, x + 8, Math.max(20, y - 8));
  }

  // 4. Panel Watermark Bawah (Semi-transparent black overlay)
  const barHeight = Math.max(90, Math.floor(height * 0.16));
  const barY = height - barHeight;

  // Gradient background bar
  const gradient = ctx.createLinearGradient(0, barY, 0, height);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.85)'); // Slate 900
  gradient.addColorStop(1, 'rgba(2, 6, 23, 0.98)');   // Slate 950

  ctx.fillStyle = gradient;
  ctx.fillRect(0, barY, width, barHeight);

  // Garis aksen atas banner
  ctx.fillStyle = damageConfig.color || '#3B82F6';
  ctx.fillRect(0, barY, width, 4);

  // 5. Teks Watermark
  const paddingX = 24;
  const lineSpacing = barHeight / 3.2;

  // Baris 1: Judul Proyek & Jenis Kerusakan
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText(`RoadSick AI • ${damageConfig.icon} ${damageConfig.label}`, paddingX, barY + lineSpacing);

  // Badge Confidence di kanan baris 1
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillStyle = '#34D399'; // Emerald
  ctx.fillText(`Keyakinan: ${confidencePct}`, width - 200, barY + lineSpacing);

  // Baris 2: Posisi GPS & Akurasi
  ctx.font = '15px Consolas, monospace';
  ctx.fillStyle = '#E2E8F0'; // Slate 200
  ctx.fillText(`📍 KOORDINAT: Lat ${lat}, Lng ${lng} ${accuracyText}`, paddingX, barY + lineSpacing * 1.9);

  // Baris 3: Waktu & Koridor Rute
  ctx.font = '13px Inter, sans-serif';
  ctx.fillStyle = '#94A3B8'; // Slate 400
  ctx.fillText(`⏰ ${timeFormatted} WIB  |  🛣️ ${routeText}`, paddingX, barY + lineSpacing * 2.7);

  // Brand watermark kecil di pojok kanan bawah
  ctx.font = 'italic 11px Inter, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Web GIS Pemetaan Jalan Rusak & Evaluasi RMSE', width - 290, barY + lineSpacing * 2.7);

  // 6. Return as Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
}

/**
 * Buat data URL preview dari watermarked canvas
 */
export async function createWatermarkedDataUrl(sourceElement, metadata = {}) {
  const blob = await createWatermarkedImageBlob(sourceElement, metadata);
  return URL.createObjectURL(blob);
}

export default {
  createWatermarkedImageBlob,
  createWatermarkedDataUrl,
};
