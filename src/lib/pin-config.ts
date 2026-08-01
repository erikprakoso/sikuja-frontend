import { RoleType } from '@/types';

export const PIN_CONFIG: Record<string, { role: RoleType; name: string }> = {
  '1111': { role: 'penjual', name: 'Panitia Penjualan' },
  '2222': { role: 'pos', name: 'Panitia Pos Check-In' },
  '3333': { role: 'mc', name: 'MC / Operator Undian' },
  '4444': { role: 'verifikator', name: 'Panitia Verifikasi Panggung' },
  '9999': { role: 'admin', name: 'Panitia Admin / Ketua' },
};
