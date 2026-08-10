import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import { SIKUJA_MAX_PRIZES_PER_PERSON } from '@/lib/storage';

/**
 * POST /api/draw/stop — Rekam kode yang tampil saat berhenti sebagai kandidat.
 *
 * Desain "Stop = kode yang berhenti": kode yang membeku di layar saat MC
 * menekan Stop dikirim ke sini. Server memverifikasi kode itu masih SAH
 * (masih status 'checkin' & kebijakan undian terpenuhi) lalu mencatatnya di
 * pending_draws sebagai kandidat. Konfirmasi via /api/draw/confirm wajib
 * mengacu ke baris pending ini — jadi kode yang tampil itulah yang menang.
 *
 * Body: { prizeId: string, code: string }
 * Response: { success, candidate, prize, audit }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['mc', 'admin']);
    if (auth instanceof NextResponse) return auth;

    if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prizeId, code } = body;

    if (!prizeId || !code) {
      return NextResponse.json({ error: 'Kode voucher dan ID hadiah wajib diisi' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ error: 'Fitur undian memerlukan Supabase yang dikonfigurasi.' }, { status: 500 });
    }

    // 1. Validasi hadiah dari pengadaan purchases (kandidat mengacu hadiah sah)
    const { data: purchases } = await serverSupabase
      .from('purchases')
      .select('*')
      .neq('is_doorprize', false);

    const targetPurchase = (purchases || []).find(
      (p) => p.id === prizeId || p.item_name.trim().toLowerCase() === prizeId.trim().toLowerCase()
    );

    if (!targetPurchase) {
      return NextResponse.json({ error: 'Hadiah tidak ditemukan' }, { status: 404 });
    }

    const prize = { id: targetPurchase.id, name: targetPurchase.item_name.trim() };

    // 2. Validasi voucher: harus ada & masih 'checkin'
    const { data: voucher, error: vErr } = await serverSupabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (vErr || !voucher) {
      return NextResponse.json({ error: `Kode ${code} tidak ditemukan` }, { status: 404 });
    }

    if (voucher.status !== 'checkin') {
      return NextResponse.json({
        error: `Kode ${code} sudah berstatus "${voucher.status}" — mulai pengundian ulang.`,
      }, { status: 409 });
    }

    // 3. Anti duplikat: satu kupon tidak boleh memiliki dua kandidat pending
    const { data: dup, error: dupErr } = await serverSupabase
      .from('pending_draws')
      .select('id')
      .eq('voucher_code', code)
      .eq('status', 'pending');
    if (dupErr) throw dupErr;
    if (dup && dup.length > 0) {
      return NextResponse.json({
        error: `Kode ${code} sudah tercatat sebagai kandidat undian lain.`,
      }, { status: 409 });
    }

    // 4. Kebijakan undian: tolak bila pembeli yang sama (transaksi yang sama)
    //    sudah memenangkan maksimal N doorprize. 0 = tanpa batas.
    if (SIKUJA_MAX_PRIZES_PER_PERSON > 0) {
      const { data: existingWinners, error: siblingErr } = await serverSupabase
        .from('vouchers')
        .select('code')
        .eq('transaction_id', voucher.transaction_id)
        .neq('code', code)
        .in('status', ['menang', 'diklaim']);
      if (siblingErr) throw siblingErr;
      if ((existingWinners || []).length >= SIKUJA_MAX_PRIZES_PER_PERSON) {
        return NextResponse.json({
          error: `Pembeli ini sudah mencapai batas maksimal ${SIKUJA_MAX_PRIZES_PER_PERSON} doorprize — kebijakan undian (maks ${SIKUJA_MAX_PRIZES_PER_PERSON} hadiah per orang).`,
        }, { status: 409 });
      }
    }

    // 5. Catat kandidat di pending_draws — kode yang tampil itulah pemenang.
    const { error: pendingErr } = await serverSupabase.from('pending_draws').insert([
      {
        prize_id: prize.id,
        voucher_code: code,
        status: 'pending',
        created_at: new Date().toISOString(),
        ...(auth.userId ? { created_by: auth.userId } : {}),
      },
    ]);
    if (pendingErr) throw pendingErr;

    // 6. Ambil nama pembeli dari transaksi untuk dipanggil MC di panggung.
    const { data: customer, error: custErr } = await serverSupabase
      .from('transactions')
      .select('customer_name')
      .eq('id', voucher.transaction_id)
      .maybeSingle();
    if (custErr) throw custErr;

    return NextResponse.json({
      success: true,
      candidate: { ...voucher, customer_name: customer?.customer_name || null },
      prize,
      audit: {
        method: 'stop = kode yang tampil',
        recorded_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API /draw/stop error:', errorMsg);
    return NextResponse.json({ error: errorMsg || 'Internal Server Error' }, { status: 500 });
  }
}
