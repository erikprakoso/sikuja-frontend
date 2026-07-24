import { RoleType, UserSession } from '@/types';

export const PIN_CONFIG: Record<string, { role: RoleType; name: string }> = {
  '1111': { role: 'penjual', name: 'Panitia Penjualan' },
  '2222': { role: 'pos', name: 'Panitia Pos Check-In' },
  '3333': { role: 'mc', name: 'MC / Operator Undian' },
  '4444': { role: 'verifikator', name: 'Panitia Verifikasi Panggung' },
  '9999': { role: 'admin', name: 'Panitia Admin / Ketua' },
};

const SESSION_KEY = 'sikuja_session';

export function verifyPin(pin: string): { success: boolean; session?: UserSession; error?: string } {
  const match = PIN_CONFIG[pin];
  if (!match) {
    return { success: false, error: 'PIN salah! Silakan coba lagi.' };
  }

  const session: UserSession = {
    role: match.role,
    name: match.name,
    authenticatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return { success: true, session };
}

export function getCurrentSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function logoutSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
