/**
 * Konfigurasi Standar 4 Kelas Kerusakan Permukaan Jalan RoadSick
 * Sesuai Proposal Skripsi Bab 1.5 Poin 2 & Tabel 2.8:
 *   0: Jalan Berlubang (Potholes)
 *   1: Jalan Tidak Rata (Rutting & Patches)
 *   2: Retak Buaya (Alligator Cracks)
 *   3: Retak Memanjang (Longitudinal Cracks)
 */

export const OFFICIAL_DAMAGE_TYPES = [
  {
    id: 'pothole',
    yoloClassId: 0,
    code: 'D00',
    label: 'Jalan Berlubang',
    shortLabel: 'Berlubang',
    englishLabel: 'Potholes',
    labelId: 'Jalan Berlubang',
    color: '#EF4444',
    markerColor: '#EF4444',
    tailwind: 'red-500',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
    borderClass: 'border-red-500',
    badgeVariant: 'pothole',
    icon: '🕳️',
    description:
      'Cekungan terbuka menyerupai mangkuk akibat mengelupasnya lapisan aspal dan tergerusnya pondasi oleh air serta beban roda.',
  },
  {
    id: 'rutting',
    yoloClassId: 1,
    code: 'D20',
    label: 'Jalan Tidak Rata',
    shortLabel: 'Tidak Rata',
    englishLabel: 'Rutting & Patches',
    labelId: 'Jalan Tidak Rata',
    color: '#8B5CF6',
    markerColor: '#8B5CF6',
    tailwind: 'purple-500',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500',
    badgeVariant: 'rutting',
    icon: '🛞',
    description:
      'Penurunan cekung memanjang pada jejak roda (rutting) atau area bekas tambalan aspal (patches) yang tingginya tidak rata.',
  },
  {
    id: 'alligator_crack',
    yoloClassId: 2,
    code: 'D10',
    label: 'Retak Buaya',
    shortLabel: 'Retak Buaya',
    englishLabel: 'Alligator Cracks',
    labelId: 'Retak Buaya',
    color: '#EA580C',
    markerColor: '#EA580C',
    tailwind: 'orange-600',
    bgClass: 'bg-orange-600',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-600',
    badgeVariant: 'alligator_crack',
    icon: '🐊',
    description:
      'Jaringan celah retakan bersilangan membentuk kotak-kotak kecil menyerupai sisik kulit buaya akibat kelelahan struktur bawah.',
  },
  {
    id: 'longitudinal_crack',
    yoloClassId: 3,
    code: 'D01',
    label: 'Retak Memanjang',
    shortLabel: 'Retak Memanjang',
    englishLabel: 'Longitudinal Cracks',
    labelId: 'Retak Memanjang',
    color: '#F59E0B',
    markerColor: '#F59E0B',
    tailwind: 'amber-500',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500',
    badgeVariant: 'longitudinal_crack',
    icon: '🔀',
    description:
      'Celah garis retakan tunggal atau bercabang tipis yang memanjang sejajar arah lajur jalan akibat penyusutan material.',
  },
];

const TYPE_MAP = Object.fromEntries(OFFICIAL_DAMAGE_TYPES.map((item) => [item.id, item]));

export const DAMAGE_TYPE_ALIASES = {
  pothole: 'pothole',
  potholes: 'pothole',
  jalan_berlubang: 'pothole',
  'jalan berlubang': 'pothole',
  d00: 'pothole',

  rutting: 'rutting',
  patches: 'rutting',
  jalan_tidak_rata: 'rutting',
  'jalan tidak rata': 'rutting',
  'rutting & patches': 'rutting',
  'rutting and patches': 'rutting',
  d20: 'rutting',
  d40: 'rutting',

  alligator_crack: 'alligator_crack',
  alligator_cracks: 'alligator_crack',
  retak_buaya: 'alligator_crack',
  'retak buaya': 'alligator_crack',
  d10: 'alligator_crack',

  longitudinal_crack: 'longitudinal_crack',
  longitudinal_cracks: 'longitudinal_crack',
  retak_memanjang: 'longitudinal_crack',
  'retak memanjang': 'longitudinal_crack',
  d01: 'longitudinal_crack',
};

/**
 * Normalisasi berbagai variasi nama kelas (model YOLO / DB lama / bahasa Indonesia)
 * ke salah satu dari 4 ID kelas resmi skripsi.
 */
export function normalizeDamageType(rawType) {
  if (!rawType) return 'longitudinal_crack';
  const key = String(rawType).trim().toLowerCase();
  if (DAMAGE_TYPE_ALIASES[key]) return DAMAGE_TYPE_ALIASES[key];
  const underscored = key.replace(/\s+/g, '_');
  if (DAMAGE_TYPE_ALIASES[underscored]) return DAMAGE_TYPE_ALIASES[underscored];
  return 'longitudinal_crack';
}

// Dictionary lookup kompatibel untuk badge, popup, canvas, dan alias
export const DAMAGE_TYPES = {
  pothole: TYPE_MAP.pothole,
  jalan_berlubang: TYPE_MAP.pothole,
  rutting: TYPE_MAP.rutting,
  patches: TYPE_MAP.rutting,
  jalan_tidak_rata: TYPE_MAP.rutting,
  alligator_crack: TYPE_MAP.alligator_crack,
  retak_buaya: TYPE_MAP.alligator_crack,
  longitudinal_crack: TYPE_MAP.longitudinal_crack,
  retak_memanjang: TYPE_MAP.longitudinal_crack,
};

export const getDamageTypeConfig = (type) => {
  const normalized = normalizeDamageType(type);
  return (
    TYPE_MAP[normalized] || {
      id: normalized,
      label: type || 'Lainnya',
      shortLabel: type || 'Lainnya',
      englishLabel: type || 'Unknown',
      labelId: type || 'Lainnya',
      icon: '⚠️',
      color: '#64748B',
      markerColor: '#64748B',
      bgClass: 'bg-slate-500',
      textClass: 'text-slate-500',
      borderClass: 'border-slate-500',
      badgeVariant: 'default',
    }
  );
};

export default DAMAGE_TYPES;
