/**
 * Standard configuration for Road Damage Types in RoadSick
 */
export const DAMAGE_TYPES = {
  pothole: {
    id: 'pothole',
    label: 'Pothole (Lubang)',
    shortLabel: 'Pothole',
    icon: '🕳️',
    color: '#EF4444',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
    borderClass: 'border-red-500',
    badgeVariant: 'pothole',
  },
  longitudinal_crack: {
    id: 'longitudinal_crack',
    label: 'Longitudinal Crack (Retak Memanjang)',
    shortLabel: 'Longitudinal Crack',
    icon: '🔀',
    color: '#F97316',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500',
    badgeVariant: 'longitudinal_crack',
  },
  alligator_crack: {
    id: 'alligator_crack',
    label: 'Alligator Crack (Retak Buaya)',
    shortLabel: 'Alligator Crack',
    icon: '🐊',
    color: '#EAB308',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-500',
    borderClass: 'border-yellow-500',
    badgeVariant: 'alligator_crack',
  },
  rutting: {
    id: 'rutting',
    label: 'Rutting (Alur Roda)',
    shortLabel: 'Rutting',
    icon: '🛞',
    color: '#3B82F6',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500',
    badgeVariant: 'rutting',
  },
  patches: {
    id: 'patches',
    label: 'Patches (Tambalan Rusak)',
    shortLabel: 'Patches',
    icon: '🩹',
    color: '#22C55E',
    bgClass: 'bg-green-500',
    textClass: 'text-green-500',
    borderClass: 'border-green-500',
    badgeVariant: 'patches',
  },
};

export const getDamageTypeConfig = (type) => {
  return DAMAGE_TYPES[type] || {
    id: type,
    label: type || 'Lainnya',
    shortLabel: type || 'Lainnya',
    icon: '⚠️',
    color: '#6B7280',
    bgClass: 'bg-gray-500',
    textClass: 'text-gray-500',
    borderClass: 'border-gray-500',
    badgeVariant: 'default',
  };
};

export default DAMAGE_TYPES;
