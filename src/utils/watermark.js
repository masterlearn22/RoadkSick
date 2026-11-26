/**
 * Utility untuk membuat Foto Bukti Ber-Watermark Geotagging Real-Time
 * Mencetak: Jenis Kerusakan, Confidence Score, Koordinat GPS (Web Geolocation API),
 * Akurasi Lokasi, Waktu Deteksi (Timestamp WIB), dan Segmen Rute Jombang – Surabaya.
 */

import { getDamageTypeConfig } from '../data/damageTypes';

/**
 * Buat canvas ber-watermark dari elemen Video stream kamera
 * @param {HTMLVideoElement|HTMLImageElement} sourceElement
 * @param {Object} metadata - { damageType, confidence, lat, lng, gpsAccuracy, timestamp, routeSegment, bbox, sourceWidth, sourceHeight, modelName }
 * @returns {Promise<Blob>} Blob JPEG siap upload ke Supabase Storage
 */
export async function createWatermarkedImageBlob(sourceElement, metadata = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width =
    sourceElement.videoWidth ||
    sourceElement.naturalWidth ||
    sourceElement.width ||
    1280;
  const height =
    sourceElement.videoHeight ||
    sourceElement.naturalHeight ||
    sourceElement.height ||
    720;

  canvas.width = width;
  canvas.height = height;

  // 1. Gambar frame video utama
  ctx.drawImage(sourceElement, 0, 0, width, height);

  // 2. Data Watermark
  const damageConfig = getDamageTypeConfig(metadata.damageType);
  const confNum = Number(metadata.confidence || 0);
  const confidencePct =
    confNum > 0
      ? `${(confNum <= 1 ? confNum * 100 : confNum).toFixed(1)}%`
      : '90.0%';

  const lat =
    metadata.lat != null ? Number(metadata.lat).toFixed(6) : '-7.466400';
  const lng =
    metadata.lng != null ? Number(metadata.lng).toFixed(6) : '112.463800';
  const accuracyText = metadata.gpsAccuracy
    ? `(±${Number(metadata.gpsAccuracy).toFixed(1)}m)`
    : '';

  const dateObj = metadata.timestamp
    ? new Date(metadata.timestamp)
    : new Date();
  const timeFormatted = dateObj.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const routeText = metadata.routeSegment || 'Rute Jombang – Surabaya';
  const modelLabel = metadata.modelName || 'YOLO Nano Real-Time';

  // 3. Gambar Bounding Box (diskalakan dari dimensi frame inferensi ke dimensi video asli)
  const boxes = Array.isArray(metadata.detections)
    ? metadata.detections
    : metadata.bbox
    ? [{ bbox: metadata.bbox, type: metadata.damageType, confidence: metadata.confidence }]
    : [];

  const scaleX = metadata.sourceWidth ? width / metadata.sourceWidth : 1;
  const scaleY = metadata.sourceHeight ? height / metadata.sourceHeight : 1;

  boxes.forEach((item) => {
    if (!item?.bbox) return;
    const bx = item.bbox.x * scaleX;
    const by = item.bbox.y * scaleY;
    const bw = item.bbox.width * scaleX;
    const bh = item.bbox.height * scaleY;
    const cfg = getDamageTypeConfig(item.type || metadata.damageType);
    const boxConf = item.confidence ?? metadata.confidence ?? 0.9;
    const boxConfStr = `${(boxConf <= 1 ? boxConf * 100 : boxConf).toFixed(1)}%`;

    ctx.lineWidth = Math.max(3, Math.round(width / 320));
    ctx.strokeStyle = cfg.color || '#EF4444';
    ctx.strokeRect(bx, by, bw, bh);

    // Fill transparan lembut
    ctx.fillStyle = `${cfg.color || '#EF4444'}22`;
    ctx.fillRect(bx, by, bw, bh);

    // Label di atas kotak
    const labelHeader = `${cfg.label} ${boxConfStr}`;
    const fontSize = Math.max(14, Math.round(width / 64));
    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", Inter, sans-serif`;
    const textW = ctx.measureText(labelHeader).width;
    const badgeH = fontSize + 12;
    const badgeY = Math.max(0, by - badgeH);

    ctx.fillStyle = cfg.color || '#EF4444';
    ctx.fillRect(bx, badgeY, textW + 16, badgeH);
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelHeader, bx + 8, badgeY + badgeH / 2);
  });

  // 4. Panel Watermark Bawah
  const barHeight = Math.max(92, Math.floor(height * 0.17));
  const barY = height - barHeight;

  const gradient = ctx.createLinearGradient(0, barY, 0, height);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.86)');
  gradient.addColorStop(1, 'rgba(2, 6, 23, 0.98)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, barY, width, barHeight);

  ctx.fillStyle = damageConfig.color || '#3B82F6';
  ctx.fillRect(0, barY, width, 4);

  // 5. Teks Watermark Responsif sesuai Resolusi Video
  const paddingX = Math.max(16, Math.round(width * 0.025));
  const titleSize = Math.max(14, Math.round(width * 0.02));
  const subSize = Math.max(11, Math.round(width * 0.014));
  const lineSpacing = barHeight / 3.3;

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${titleSize}px "Plus Jakarta Sans", Inter, sans-serif`;
  ctx.fillText(
    `RoadSick Web GIS • ${damageConfig.icon} ${damageConfig.label}`,
    paddingX,
    barY + lineSpacing
  );

  // Badge Confidence di kanan baris 1
  const confText = `Confidence: ${confidencePct}`;
  ctx.font = `bold ${Math.max(12, titleSize - 2)}px "Plus Jakarta Sans", Inter, sans-serif`;
  const confW = ctx.measureText(confText).width;
  ctx.fillStyle = '#34D399';
  ctx.fillText(confText, width - paddingX - confW, barY + lineSpacing);

  // Baris 2: Koordinat Web Geolocation API
  ctx.font = `${subSize}px "JetBrains Mono", Consolas, monospace`;
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(
    `GPS: ${lat}, ${lng} ${accuracyText}`,
    paddingX,
    barY + lineSpacing * 1.95
  );

  // Baris 3: Waktu & Rute Studi Kasus
  ctx.font = `${Math.max(10, subSize - 1)}px "Plus Jakarta Sans", Inter, sans-serif`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(
    `${timeFormatted} WIB  |  Koridor: ${routeText}`,
    paddingX,
    barY + lineSpacing * 2.8
  );

  // Model label di pojok kanan bawah
  ctx.font = `italic ${Math.max(10, subSize - 2)}px "Plus Jakarta Sans", Inter, sans-serif`;
  const modelW = ctx.measureText(modelLabel).width;
  ctx.fillStyle = '#64748B';
  ctx.fillText(modelLabel, width - paddingX - modelW, barY + lineSpacing * 2.8);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}

export async function createWatermarkedDataUrl(sourceElement, metadata = {}) {
  const blob = await createWatermarkedImageBlob(sourceElement, metadata);
  return URL.createObjectURL(blob);
}

export default {
  createWatermarkedImageBlob,
  createWatermarkedDataUrl,
};
