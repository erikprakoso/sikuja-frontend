import { NextResponse } from 'next/server';
import { getActivePinLength } from '@/lib/server-auth';

// Publik (tanpa auth) — memberi tahu client berapa digit PIN yang aktif saat ini.
// 4 digit = dev lokal, 6 digit = production (selalu). Tidak membocorkan PIN.
export async function GET() {
  const pinLength = await getActivePinLength();
  return NextResponse.json({ success: true, pinLength });
}
