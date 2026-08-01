import { UserSession } from '@/types';
import { SIKUJA_EVENT_NAME } from '@/lib/storage';

const SESSION_KEY = 'sikuja_session';

function notifySessionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SIKUJA_EVENT_NAME));
  }
}

export async function verifyPin(
  pin: string
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'PIN salah! Silakan coba lagi.' };
    }

    // Cache untuk keperluan UI (sumber kebenaran tetap cookie httpOnly di server)
    if (typeof window !== 'undefined' && data.session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      notifySessionChange();
    }

    return { success: true, session: data.session };
  } catch {
    return { success: false, error: 'Gagal terhubung ke server. Periksa koneksi internet.' };
  }
}

// Membaca session untuk UI (cache lokal). Otorisasi sebenarnya divalidasi server via cookie.
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

// Sinkronkan cache UI dengan kebenaran server (cookie). Panggil saat halaman dimuat.
export async function refreshSession(): Promise<UserSession | null> {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    const session = data?.session as UserSession | null;

    if (session) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
      return session;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      notifySessionChange();
    }
    return null;
  } catch {
    return getCurrentSession();
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Tetap bersihkan sesi lokal meski server tidak terjangkau.
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    notifySessionChange();
  }
}
