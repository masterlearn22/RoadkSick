import React, { useEffect, useRef } from 'react';
import { DAMAGE_TYPES } from '../../data/damageTypes';

/**
 * BoundingBoxCanvas
 * Canvas overlay component for drawing bounding boxes on top of images or video frames.
 *
 * @param {Array} detections - Array of { bbox: { x, y, width, height }, type, confidence }
 * @param {number} width - Width of canvas / container
 * @param {number} height - Height of canvas / container
 * @param {string} className - Additional CSS classes
 */
const BoundingBoxCanvas = ({
  detections = [],
  width,
  height,
  className = '',
}) => {
  const canvasRef = useRef(null);

  // Helper to convert hex to rgba
  const hexToRgba = (hex, alpha = 0.2) => {
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

    // Adjust for parent size or explicit width/height
    const canvasWidth = width || canvas.parentElement?.clientWidth || 640;
    const canvasHeight = height || canvas.parentElement?.clientHeight || 360;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!detections || detections.length === 0) return;

    detections.forEach((det) => {
      if (!det || !det.bbox) return;

      const { x, y, width: boxWidth, height: boxHeight } = det.bbox;
      const typeInfo = DAMAGE_TYPES[det.type] || {
        label: det.type || 'Unknown',
        color: '#EF4444',
      };
      const color = typeInfo.color || '#EF4444';
      const labelText = `${typeInfo.label} ${
        det.confidence !== undefined
          ? `${(det.confidence * 100).toFixed(1)}%`
          : ''
      }`.trim();

      // Draw semi-transparent fill
      ctx.fillStyle = hexToRgba(color, 0.22);
      ctx.fillRect(x, y, boxWidth, boxHeight);

      // Draw border
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, boxWidth, boxHeight);

      // Calculate label badge dimensions
      ctx.font = 'bold 12px Inter, ui-sans-serif, system-ui, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const badgePaddingX = 8;
      const badgeHeight = 22;
      const badgeWidth = textWidth + badgePaddingX * 2;

      // Ensure badge doesn't get cut off at the top
      let badgeY = y - badgeHeight;
      if (badgeY < 0) {
        badgeY = y; // draw inside top of box if at top edge
      }
      let badgeX = x;
      if (badgeX + badgeWidth > canvasWidth) {
        badgeX = canvasWidth - badgeWidth - 4;
      }
      if (badgeX < 0) badgeX = 4;

      // Draw label background pill
      ctx.fillStyle = color;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, [4, 4, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      }

      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, badgeX + badgePaddingX, badgeY + badgeHeight / 2);
    });
  }, [detections, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 w-full h-full ${className}`}
    />
  );
};

export default BoundingBoxCanvas;
