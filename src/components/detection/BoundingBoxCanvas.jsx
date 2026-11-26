import React, { useEffect, useRef } from 'react';
import { getDamageTypeConfig } from '../../data/damageTypes';

/**
 * BoundingBoxCanvas
 * Menggambar bounding box deteksi YOLO di atas elemen <video> (mendukung skala object-cover).
 */
const BoundingBoxCanvas = ({
  detections = [],
  sourceWidth = 640,
  sourceHeight = 360,
  objectFit = 'cover', // 'cover' | 'contain' | 'fill'
  className = '',
}) => {
  const canvasRef = useRef(null);

  const hexToRgba = (hex, alpha = 0.18) => {
    if (!hex) return `rgba(239, 68, 68, ${alpha})`;
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const containerW = canvas.parentElement?.clientWidth || sourceWidth || 640;
      const containerH = canvas.parentElement?.clientHeight || sourceHeight || 360;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = containerW * dpr;
      canvas.height = containerH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, containerW, containerH);

      if (!detections || detections.length === 0) return;

      const srcW = Math.max(1, sourceWidth || 640);
      const srcH = Math.max(1, sourceHeight || 360);

      let scaleX = containerW / srcW;
      let scaleY = containerH / srcH;
      let offsetX = 0;
      let offsetY = 0;

      if (objectFit === 'cover') {
        const scale = Math.max(scaleX, scaleY);
        scaleX = scale;
        scaleY = scale;
        offsetX = (containerW - srcW * scale) / 2;
        offsetY = (containerH - srcH * scale) / 2;
      } else if (objectFit === 'contain') {
        const scale = Math.min(scaleX, scaleY);
        scaleX = scale;
        scaleY = scale;
        offsetX = (containerW - srcW * scale) / 2;
        offsetY = (containerH - srcH * scale) / 2;
      }

      detections.forEach((det) => {
        if (!det?.bbox) return;
        const bx = det.bbox.x * scaleX + offsetX;
        const by = det.bbox.y * scaleY + offsetY;
        const bw = det.bbox.width * scaleX;
        const bh = det.bbox.height * scaleY;

        const typeInfo = getDamageTypeConfig(det.type);
        const color = typeInfo.color || '#EF4444';
        const confVal =
          det.confidence !== undefined
            ? `${((det.confidence <= 1 ? det.confidence * 100 : det.confidence)).toFixed(1)}%`
            : '';
        const labelText = `${typeInfo.shortLabel} ${confVal}`.trim();

        // Fill transparan lembut
        ctx.fillStyle = hexToRgba(color, 0.18);
        ctx.fillRect(bx, by, bw, bh);

        // Border kotak utama
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        ctx.strokeRect(bx, by, bw, bh);

        // Aksen sudut corner highlight
        const cornerLen = Math.min(14, bw * 0.25, bh * 0.25);
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        // Top-right
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        // Bottom-left
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        // Bottom-right
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Label badge
        ctx.font = '700 12px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        const badgePaddingX = 8;
        const badgeHeight = 22;
        const badgeWidth = textWidth + badgePaddingX * 2;

        let badgeY = by - badgeHeight;
        if (badgeY < 4) badgeY = by + 2;
        let badgeX = bx;
        if (badgeX + badgeWidth > containerW - 4) {
          badgeX = containerW - badgeWidth - 4;
        }
        if (badgeX < 4) badgeX = 4;

        ctx.fillStyle = color;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
          ctx.fill();
        } else {
          ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, badgeX + badgePaddingX, badgeY + badgeHeight / 2);
      });
    };

    draw();

    const observer =
      typeof ResizeObserver !== 'undefined' && canvas.parentElement
        ? new ResizeObserver(draw)
        : null;
    if (observer && canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [detections, sourceWidth, sourceHeight, objectFit]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 w-full h-full ${className}`}
    />
  );
};

export default BoundingBoxCanvas;
