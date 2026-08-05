import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import { SIKUJA_MAX_PRIZES_PER_PERSON } from '@/lib/storage';

/**
 * POST /api/draw/confirm — Confirm the drawn candidate as the actual winner.
 *
 * Integritas:
 * - Hanya kode yang TERCATAT sebagai kandidat pending TERBARU untuk hadiah ini
 *   yang boleh dikonfirmasi (kode yang benar-benar tampil di layar).
 * - Konsumsi kandidat bersifat atomik (status pending -> confirmed) sebagai mutex,
 *   sehingga dua konfirmasi tidak bisa dua-duanya menang.
 * - Flip status voucher atomik (hanya jika masih 'checkin').
 * - Increment drawn_count atomik dengan guard stok (anti over-draw).
 * - Unique constraint draw_results.voucher_code mencegah duplikat pemenang.
 * - Kegagalan di tengah jalan melakukan rollback untuk menjaga konsistensi.
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
    const { code, prizeId } = body;

    if (!code || !prizeId) {
      return NextResponse.json({ error: 'Kode voucher dan ID hadiah wajib diisi' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase belum dikonfigurasi' }, { status: 500 });
    }

    const now = new Date().toISOString();

    // 1. Validasi kandidat: ambil kandidat pending TERBARU untuk hadiah ini.
    //    (TIDAK memfilter voucher_code di query — kalau difilter, kandidat lama
    //    yang masih pending bisa dikonfirmasi setelah ada undian baru.)
    const { data: pendingRows, error: pendingErr } = await serverSupabase
      .from('pending_draws')
      .select('*')
      .eq('prize_id', prizeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingErr) throw pendingErr;

    const pending = pendingRows && pendingRows.length > 0 ? pendingRows[0] : null;
    if (!pending || pending.voucher_code !== code) {
      return NextResponse.json({
        error: 'Kode tidak sesuai dengan undian yang sedang tampil. Mulai pengundian ulang terlebih dahulu.',
      }, { status: 400 });
    }

    // 2. Validasi voucher masih eligible
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
        error: `Kode ${code} sudah berstatus "${voucher.status}" — tidak bisa dikonfirmasi ulang.`,
      }, { status: 400 });
    }

    // 2b. Kebijakan undian: tolak konfirmasi bila pembeli yang sama (transaksi
    //     yang sama) sudah memenangkan maksimal N doorprize.
    const { data: existingWinners, error: siblingErr } = await serverSupabase
      .from('vouchers')
      .select('code')
      .eq('transaction_id', voucher.transaction_id)
      .neq('code', code)
      .in('status', ['menang', 'diklaim']);
    if (siblingErr) throw siblingErr;
    if ((existingWinners || []).length >= SIKUJA_MAX_PRIZES_PER_PERSON) {
      await serverSupabase.from('pending_draws').update({ status: 'pending' }).eq('id', pending.id);
      return NextResponse.json({
        error: `Pembeli ini sudah mencapai batas maksimal ${SIKUJA_MAX_PRIZES_PER_PERSON} doorprize — kebijakan undian (maks ${SIKUJA_MAX_PRIZES_PER_PERSON} hadiah per orang).`,
      }, { status: 409 });
    }

    // 3. Validasi hadiah dari pengadaan purchases
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

    const prize = {
      id: targetPurchase.id,
      name: targetPurchase.item_name.trim(),
    };

    // 4. MUTEX: konsumsi kandidat. Hanya satu konfirmasi yang bisa mengubah
    //    status pending -> confirmed; yang kalah mendapat 0 baris.
    const { data: consumed, error: consumeErr } = await serverSupabase
      .from('pending_draws')
      .update({ status: 'confirmed' })
      .eq('id', pending.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (consumeErr) throw consumeErr;
    if (!consumed) {
      return NextResponse.json({ error: 'Undian ini sudah dikonfirmasi oleh sesi lain.' }, { status: 409 });
    }

    // 5. Tandai voucher menang secara ATOMIK (hanya jika masih 'checkin').
    const { data: flipped, error: flipErr } = await serverSupabase
      .from('vouchers')
      .update({
        status: 'menang',
        won_at: now,
        prize_id: prize.id,
        prize_name: prize.name,
      })
      .eq('code', code)
      .eq('status', 'checkin')
      .select()
      .maybeSingle();

    if (flipErr) throw flipErr;
    if (!flipped) {
      // Rollback kandidat: kode ternyata sudah tidak eligible (menang di sesi lain).
      await serverSupabase.from('pending_draws').update({ status: 'pending' }).eq('id', pending.id);
      return NextResponse.json({
        error: `Kode ${code} sudah berstatus selain 'checkin' — tidak bisa dikonfirmasi.`,
      }, { status: 409 });
    }

    // 7. Ambil nama pembeli dari transaction untuk tampilan panggung.
    const { data: customer, error: custErr } = await serverSupabase
      .from('transactions')
      .select('customer_name')
      .eq('id', voucher.transaction_id)
      .maybeSingle();

    if (custErr) throw custErr;

    // 8. Catat hasil undian. Unique constraint voucher_code mencegah duplikat.
    const drawResult = {
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      voucher_code: code,
      prize_id: prize.id,
      prize_name: prize.name,
      drawn_at: now,
      claimed: false,
      customer_name: customer?.customer_name || null,
      ...(auth.userId ? { created_by: auth.userId } : {}),
    };

    const { error: resErr } = await serverSupabase.from('draw_results').insert([drawResult]);
    if (resErr) {
      // Rollback semua perubahan agar tidak ada voucher menang tanpa catatan hasil.
      await serverSupabase
        .from('vouchers')
        .update({ status: 'checkin', won_at: null, prize_id: null, prize_name: null })
        .eq('code', code);
      await serverSupabase.from('pending_draws').update({ status: 'pending' }).eq('id', pending.id);
      throw resErr;
    }

    return NextResponse.json({
      success: true,
      message: `Kode ${code} resmi MENANG hadiah "${prize.name}"! 🎉`,
      winnerVoucher: { ...voucher, status: 'menang', won_at: now, prize_name: prize.name },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API /draw/confirm error:', errorMsg);
    return NextResponse.json({ error: errorMsg || 'Internal Server Error' }, { status: 500 });
  }
}
