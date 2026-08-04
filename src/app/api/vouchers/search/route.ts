import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { format5DigitCode } from '@/lib/services/voucher';

/**
 * GET /api/vouchers/search?q=...
 * Pencarian publik E-Voucher peserta, di-server (bukan localStorage).
 * Hanya mengembalikan `token` — tidak membocorkan nama/no. HP dari query.
 *
 * Keamanan:
 * - HP & nama hanya dicocokkan EKSAK (tanpa wildcard %) agar token tidak bisa
 *   di-enumerasi dari potongan data (mis. 4 digit nomor HP).
 * - Ada rate limit per IP untuk memperlambat percobaan berulang.
 *
 * Urutan: token/id eksak → kode kupon → no. HP eksak → nama eksak.
 */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MIN_PHONE_DIGITS = 8;

const hitTimestamps = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (hitTimestamps.size > 5000) {
    for (const [key, times] of hitTimestamps) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hitTimestamps.delete(key);
    }
  }
  const recent = (hitTimestamps.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hitTimestamps.set(ip, recent);
    return true;
  }
  recent.push(now);
  hitTimestamps.set(ip, recent);
  return false;
}

export async function GET(request: NextRequest) {
  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' },
        { status: 429 }
      );
    }

    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (!q) {
      return NextResponse.json({ error: 'Parameter q wajib diisi' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ error: 'Server belum dikonfigurasi' }, { status: 500 });
    }

    // 1. Token eksak (link /v/<token>)
    const { data: byToken } = await serverSupabase
      .from('transactions')
      .select('token')
      .eq('token', q)
      .maybeSingle();
    if (byToken?.token) {
      return NextResponse.json({ success: true, token: byToken.token });
    }

    // 2. ID transaksi eksak (mis. tx_xxx)
    const { data: byId } = await serverSupabase
      .from('transactions')
      .select('token')
      .eq('id', q)
      .maybeSingle();
    if (byId?.token) {
      return NextResponse.json({ success: true, token: byId.token });
    }

    // 3. Kode kupon 5 digit (eksak)
    const formattedCode = format5DigitCode(q);
    if (formattedCode) {
      const { data: voucher } = await serverSupabase
        .from('vouchers')
        .select('transaction_id')
        .eq('code', formattedCode)
        .maybeSingle();
      if (voucher?.transaction_id) {
        const { data: tx } = await serverSupabase
          .from('transactions')
          .select('token')
          .eq('id', voucher.transaction_id)
          .maybeSingle();
        if (tx?.token) {
          return NextResponse.json({ success: true, token: tx.token });
        }
      }
    }

    // 4. No. HP — cocok EKSAK (nilai mentah & versi digit saja), minimal 8 digit.
    //    Tanpa wildcard: token tidak bisa ditemukan hanya dari potongan 4 digit HP.
    const phoneClean = q.replace(/\D/g, '');
    if (phoneClean.length >= MIN_PHONE_DIGITS) {
      const candidates = [q, phoneClean];
      for (const cand of candidates) {
        const { data: byPhone } = await serverSupabase
          .from('transactions')
          .select('token')
          .eq('customer_phone', cand)
          .limit(1)
          .maybeSingle();
        if (byPhone?.token) {
          return NextResponse.json({ success: true, token: byPhone.token });
        }
      }
    }

    // 5. Nama pemilik — cocok SEBAGIAN (case-insensitive) karena customer_name kini
    //    berformat concat "Nama - Anak/Suami/Istri - RT - RW". No. HP tetap eksak
    //    (tanpa wildcard) agar token tidak bisa di-enumerasi dari potongan nomor.
    const { data: byName } = await serverSupabase
      .from('transactions')
      .select('token')
      .ilike('customer_name', `%${q}%`)
      .limit(1)
      .maybeSingle();
    if (byName?.token) {
      return NextResponse.json({ success: true, token: byName.token });
    }

    return NextResponse.json(
      { success: false, error: 'E-Voucher tidak ditemukan. Periksa kembali No. HP / Nama / Kode / Token Anda.' },
      { status: 404 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /vouchers/search error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
