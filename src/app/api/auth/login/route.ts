import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPinServer,
  createSessionToken,
  checkLoginRateLimit,
  getClientIp,
  SESSION_COOKIE,
} from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkLoginRateLimit(ip);
  if (!limit.allowed) {
    const retryMinutes = Math.ceil((limit.retryAfterMs || 0) / 60000);
    return NextResponse.json(
      { error: `Terlalu banyak percobaan login. Coba lagi dalam ${retryMinutes} menit.` },
      { status: 429 }
    );
  }

  let pin = '';
  try {
    const body = await request.json();
    pin = String(body.pin || '').trim();
  } catch {
    return NextResponse.json({ error: 'Request tidak valid' }, { status: 400 });
  }

  const session = verifyPinServer(pin);
  if (!session) {
    return NextResponse.json({ error: 'PIN salah! Silakan coba lagi.' }, { status: 401 });
  }

  const token = createSessionToken(session);
  if (!token) {
    return NextResponse.json(
      { error: 'Sesi server belum dikonfigurasi (AUTH_SESSION_SECRET).' },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true, session });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
