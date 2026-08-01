import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { format5DigitCode } from '@/lib/services/voucher';

/**
 * GET /api/vouchers/search?q=...
 * Pencarian publik E-Voucher peserta, di-server (bukan localStorage).
 * Hanya mengembalikan `token` — tidak membocorkan nama/no. HP dari query.
 * Urutan: token/id eksak → kode kupon → no. HP → nama pemilik.
 */
export async function GET(request: NextRequest) {
  try {
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

    // 3. Kode kupon 5 digit
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

    // 4. No. HP / WhatsApp (parsial, minimal 4 digit)
    const phoneClean = q.replace(/\D/g, '');
    if (phoneClean.length >= 4) {
      const { data: byPhone } = await serverSupabase
        .from('transactions')
        .select('token')
        .ilike('customer_phone', `%${phoneClean}%`)
        .limit(1)
        .maybeSingle();
      if (byPhone?.token) {
        return NextResponse.json({ success: true, token: byPhone.token });
      }
    }

    // 5. Nama pemilik (parsial)
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
