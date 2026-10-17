import { create } from 'zustand';

/**
 * Zustand store for managing YOLOv8 road damage detections across modes (Image, Video, Realtime).
 */
const initialRealtimeSession = {
  isActive: false,
  sessionId: null,
  detections: [],
  stats: {
    totalFrames: 0,
    damageCount: 0,
    lastDetectedAt: null,
  },
};

const useDetectionStore = create((set, get) => ({
  // State
  detections: [],
  activeMode: 'image', // 'realtime' | 'video' | 'image'
  isProcessing: false,
  realtimeSession: { ...initialRealtimeSession },
  videoResult: null,
  imageResult: null,

  // Actions
  setActiveMode: (mode) => set({ activeMode: mode }),

  setDetections: (detections) => set({ detections }),

  addDetection: (detection) =>
    set((state) => ({
      detections: [detection, ...state.detections],
    })),

  addRealtimeDetection: (detection) =>
    set((state) => {
      const updatedDetections = [detection, ...state.realtimeSession.detections];
      return {
        // Also add to master detections list if not already present
        detections: [detection, ...state.detections],
        realtimeSession: {
          ...state.realtimeSession,
          detections: updatedDetections,
          stats: {
            ...state.realtimeSession.stats,
            damageCount: updatedDetections.length,
            lastDetectedAt: detection.timestamp || new Date().toISOString(),
          },
        },
      };
    }),

  setProcessing: (bool) => set({ isProcessing: bool }),

  setVideoResult: (result) => set({ videoResult: result }),

  setImageResult: (result) => set({ imageResult: result }),

  setRealtimeActive: (isActive, sessionId = null) =>
    set((state) => ({
      realtimeSession: {
        ...state.realtimeSession,
        isActive,
        sessionId: sessionId || state.realtimeSession.sessionId,
      },
    })),

  clearRealtimeSession: () =>
    set({
      realtimeSession: { ...initialRealtimeSession },
    }),

  resetAll: () =>
    set({
      detections: [],
      activeMode: 'image',
      isProcessing: false,
      realtimeSession: { ...initialRealtimeSession },
      videoResult: null,
      imageResult: null,
    }),

  // Computed helper selectors
  getDetectionsByType: () => {
    const { detections } = get();
    return detections.reduce((acc, item) => {
      const typeKey = item.type || 'other';
      if (!acc[typeKey]) {
        acc[typeKey] = [];
      }
      acc[typeKey].push(item);
      return acc;
    }, {});
  },

  getDetectionStats: () => {
    const { detections } = get();
    const total = detections.length;
    const byType = detections.reduce((acc, curr) => {
      const type = curr.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const bySeverity = detections.reduce((acc, curr) => {
      const sev = curr.severity || 'low';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      byType,
      bySeverity,
      averageConfidence:
        total > 0
          ? +(
              detections.reduce((sum, d) => sum + (d.confidence || 0), 0) /
              total
            ).toFixed(2)
          : 0,
    };
  },
}));

export default useDetectionStore;
