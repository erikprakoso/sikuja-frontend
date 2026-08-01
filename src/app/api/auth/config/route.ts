import { NextResponse } from 'next/server';
import { getActivePinLength } from '@/lib/server-auth';

// Publik (tanpa auth) — memberi tahu client berapa digit PIN yang aktif saat ini.
// 4 digit = mode bootstrap (tabel users masih kosong), 6 digit = mode normal.
export async function GET() {
  const pinLength = await getActivePinLength();
  return NextResponse.json({ success: true, pinLength });
}
