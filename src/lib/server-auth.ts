import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual, randomBytes, scryptSync, randomInt } from 'crypto';
import { RoleType, UserSession } from '@/types';
import { PIN_CONFIG } from '@/lib/pin-config';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';

export const SESSION_COOKIE = 'sikuja_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

interface SessionPayload extends UserSession {
  exp: number;
}

// Secret must come from AUTH_SESSION_SECRET env in production.
// In development we fall back to a random per-process secret so the app
// still runs locally. Without the env var in production, auth fails closed.
let devSecret: string | null = null;
function getSecret(): string | null {
  if (process.env.AUTH_SESSION_SECRET) return process.env.AUTH_SESSION_SECRET;
  if (process.env.NODE_ENV !== 'production') {
    if (!devSecret) devSecret = randomBytes(32).toString('hex');
    return devSecret;
  }
  return null;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(session: UserSession): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload: SessionPayload = { ...session, exp: Date.now() + SESSION_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): UserSession | null {
  const secret = getSecret();
  if (!secret) return null;

  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expected = sign(encoded, secret);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(sig, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.role || !payload.name) return null;
    return {
      role: payload.role,
      name: payload.name,
      authenticatedAt: payload.authenticatedAt,
    };
  } catch {
    return null;
  }
}

const SCRYPT_KEYLEN = 32;

/** Generate PIN acak 6 digit (100000–999999, tanpa leading zero). */
export function generateRandomPin(): string {
  return String(randomInt(100000, 1000000));
}

/** Hash PIN dengan scrypt + salt acak per user. */
export function hashPin(pin: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash };
}

/** Verifikasi PIN terhadap hash tersimpan (timing-safe). */
export function verifyPinHash(pin: string, salt: string, hash: string): boolean {
  const candidate = scryptSync(pin, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/**
 * Login: verifikasi PIN terhadap tabel `users` di database.
 * Fallback ke PIN_CONFIG (PIN lama) HANYA di luar production (dev lokal),
 * agar bisa menguji tanpa database. Di production TIDAK ada fallback —
 * login wajib lewat PIN unik yang terdaftar (fail-closed, tanpa celah).
 */
export async function verifyPinServer(pin: string): Promise<UserSession | null> {
  if (process.env.NODE_ENV !== 'production') {
    const match = PIN_CONFIG[pin];
    if (match) {
      return {
        userId: null,
        role: match.role,
        name: match.name,
        authenticatedAt: new Date().toISOString(),
      };
    }
  }

  if (!isServerSupabaseConfigured()) return null; // fail-closed

  const { data: users, error } = await serverSupabase
    .from('users')
    .select('id, name, role, pin_salt, pin_hash, active');

  if (error) throw error;

  for (const u of users || []) {
    if (u.active !== true) continue;
    if (verifyPinHash(pin, u.pin_salt, u.pin_hash)) {
      return {
        userId: u.id,
        role: u.role as RoleType,
        name: u.name,
        authenticatedAt: new Date().toISOString(),
      };
    }
  }
  return null;
}

/**
 * Fallback (PIN lama 4 digit) aktif HANYA di luar production (dev lokal).
 * Di production selalu false → tidak ada PIN bawaan, tidak ada celah.
 */
export async function isFallbackActive(): Promise<boolean> {
  return process.env.NODE_ENV !== 'production';
}

/** Panjang PIN yang harus diketuk: 4 saat dev lokal, 6 di production. */
export async function getActivePinLength(): Promise<number> {
  return (await isFallbackActive()) ? 4 : 6;
}

export function getSessionFromRequest(request: NextRequest): UserSession | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Guard untuk API route handler.
 * Returns the UserSession on success, or a NextResponse (401/403) to short-circuit.
 * Penggunaan: const auth = requireAuth(request, ['admin']); if (auth instanceof NextResponse) return auth;
 */
export function requireAuth(
  request: NextRequest,
  allowedRoles?: RoleType[]
): UserSession | NextResponse {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: silakan login terlebih dahulu.' },
      { status: 401 }
    );
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return NextResponse.json(
      { error: 'Forbidden: peran Anda tidak memiliki akses ke operasi ini.' },
      { status: 403 }
    );
  }
  return session;
}

export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// ---- Login rate limiter (in-memory, per IP) ----
interface RateRecord {
  count: number;
  resetAt: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 menit
const loginAttempts = new Map<string, RateRecord>();

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const rec = loginAttempts.get(ip);

  if (!rec || rec.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (rec.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: rec.resetAt - now };
  }

  rec.count += 1;
  return { allowed: true };
}
