import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

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

    // 3. Validasi hadiah
    const { data: prize, error: pErr } = await serverSupabase
      .from('prizes')
      .select('*')
      .eq('id', prizeId)
      .maybeSingle();

    if (pErr || !prize) {
      return NextResponse.json({ error: 'Hadiah tidak ditemukan' }, { status: 404 });
    }

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

    // 6. Increment stok terpakai secara ATOMIK dengan guard stok (anti over-draw).
    const { data: updatedPrize, error: incErr } = await serverSupabase
      .from('prizes')
      .update({ drawn_count: prize.drawn_count + 1 })
      .eq('id', prize.id)
      .lt('drawn_count', prize.stock)
      .select()
      .maybeSingle();

    if (incErr) throw incErr;
    if (!updatedPrize) {
      // Rollback voucher + kandidat.
      await serverSupabase
        .from('vouchers')
        .update({ status: 'checkin', won_at: null, prize_id: null, prize_name: null })
        .eq('code', code);
      await serverSupabase.from('pending_draws').update({ status: 'pending' }).eq('id', pending.id);
      return NextResponse.json({
        error: `Stok hadiah "${prize.name}" sudah habis!`,
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
      await serverSupabase.from('prizes').update({ drawn_count: prize.drawn_count - 1 }).eq('id', prize.id);
      await serverSupabase.from('pending_draws').update({ status: 'pending' }).eq('id', pending.id);
      throw resErr;
    }

    return NextResponse.json({
      success: true,
      message: `Kode ${code} resmi MENANG hadiah "${prize.name}"! 🎉`,
      winnerVoucher: { ...voucher, status: 'menang', won_at: now, prize_name: prize.name },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /draw/confirm error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
