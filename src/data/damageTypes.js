/**
 * Damage types definition with metadata and UI color mappings
 */

export const DAMAGE_TYPES = {
  pothole: {
    label: 'Pothole',
    labelId: 'Lubang Jalan',
    color: '#EF4444',
    tailwind: 'red-500',
    icon: '🕳️',
    markerColor: '#EF4444',
    description: 'Kerusakan berupa cekungan atau lubang pada permukaan perkerasan jalan.',
  },
  longitudinal_crack: {
    label: 'Longitudinal Crack',
    labelId: 'Retak Memanjang',
    color: '#F97316',
    tailwind: 'orange-500',
    icon: '🔀',
    markerColor: '#F97316',
    description: 'Retak yang membentang sejajar dengan sumbu atau jalur lalu lintas jalan.',
  },
  alligator_crack: {
    label: 'Alligator Crack',
    labelId: 'Retak Buaya',
    color: '#EAB308',
    tailwind: 'yellow-500',
    icon: '🐊',
    markerColor: '#EAB308',
    description: 'Rangkaian retak saling berhubungan membentuk pola kulit buaya atau jaring.',
  },
  rutting: {
    label: 'Rutting',
    labelId: 'Alur Roda',
    color: '#3B82F6',
    tailwind: 'blue-500',
    icon: '🛞',
    markerColor: '#3B82F6',
    description: 'Depresi memanjang pada jalur jejak roda kendaraan akibat beban berlebih.',
  },
  patches: {
    label: 'Patches',
    labelId: 'Tambalan',
    color: '#22C55E',
    tailwind: 'green-500',
    icon: '🩹',
    markerColor: '#22C55E',
    description: 'Area perbaikan atau penambalan jalan yang telah dilakukan sebelumnya.',
  },
};

export default DAMAGE_TYPES;
