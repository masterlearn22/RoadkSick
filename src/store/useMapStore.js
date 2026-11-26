import { create } from 'zustand';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../utils/constants';

const ALL_DAMAGE_TYPES = [
  'pothole',
  'rutting',
  'alligator_crack',
  'longitudinal_crack',
];

const DEFAULT_FILTERS = {
  types: [...ALL_DAMAGE_TYPES],
  severity: 'all',
  dateRange: { start: null, end: null },
};

/**
 * Zustand store untuk Web GIS Map (Rute Jombang - Surabaya)
 */
const useMapStore = create((set) => ({
  center: [...DEFAULT_CENTER],
  zoom: DEFAULT_ZOOM,
  selectedMarker: null,
  filters: { ...DEFAULT_FILTERS },
  markers: [],

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
