import { create } from 'zustand';

/**
 * Zustand store untuk manajemen sesi Real-Time Object Detection
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
  detections: [],
  isProcessing: false,
  realtimeSession: { ...initialRealtimeSession },

  setDetections: (detections) => set({ detections }),

  addDetection: (detection) =>
    set((state) => ({
      detections: [detection, ...state.detections],
    })),

  addRealtimeDetection: (detection) =>
    set((state) => {
      const updatedDetections = [detection, ...state.realtimeSession.detections];
      return {
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

  getDetectionStats: () => {
    const { detections } = get();
    const total = detections.length;
    const byType = detections.reduce((acc, curr) => {
      const type = curr.type || 'longitudinal_crack';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return {
      total,
      byType,
      averageConfidence:
        total > 0
          ? +(
              detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / total
            ).toFixed(2)
          : 0,
    };
  },
}));

export default useDetectionStore;
