/**
 * Re-export konfigurasi standar 4 kelas kerusakan jalan dari src/data/damageTypes.js
 * agar seluruh komponen menggunakan satu sumber kebenaran (single source of truth).
 */
export {
  OFFICIAL_DAMAGE_TYPES,
  DAMAGE_TYPE_ALIASES,
  DAMAGE_TYPES,
  normalizeDamageType,
  getDamageTypeConfig,
} from '../data/damageTypes';

export { default } from '../data/damageTypes';
