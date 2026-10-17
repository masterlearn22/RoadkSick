import { create } from 'zustand';

const ALL_DAMAGE_TYPES = [
  'pothole',
  'longitudinal_crack',
  'alligator_crack',
  'rutting',
  'patches',
];

const DEFAULT_FILTERS = {
  types: [...ALL_DAMAGE_TYPES],
  severity: 'all',
  dateRange: { start: null, end: null },
};

const DEFAULT_CENTER = [-6.917, 107.619]; // Bandung, Jawa Barat
const DEFAULT_ZOOM = 14;

/**
 * Zustand store for Web GIS mapping, viewport center/zoom, layers, and spatial marker filtering.
 */
const useMapStore = create((set) => ({
  // State
  center: [...DEFAULT_CENTER],
  zoom: DEFAULT_ZOOM,
  selectedMarker: null,
  filters: { ...DEFAULT_FILTERS },
  markers: [],

  // Actions
  setCenter: (coords) => set({ center: coords }),

  setZoom: (level) => set({ zoom: level }),

  setSelectedMarker: (marker) => set({ selectedMarker: marker }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  toggleTypeFilter: (type) =>
    set((state) => {
      const currentTypes = state.filters.types;
      const exists = currentTypes.includes(type);
      const updatedTypes = exists
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];

      return {
        filters: {
          ...state.filters,
          types: updatedTypes,
        },
      };
    }),

  setSeverityFilter: (severity) =>
    set((state) => ({
      filters: {
        ...state.filters,
        severity,
      },
    })),

  setDateRange: (start, end) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: { start, end },
      },
    })),

  resetFilters: () =>
    set({
      filters: { ...DEFAULT_FILTERS, types: [...ALL_DAMAGE_TYPES] },
    }),

  setMarkers: (markers) => set({ markers }),
}));

export default useMapStore;
