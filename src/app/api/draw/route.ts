import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import { SIKUJA_MAX_PRIZES_PER_PERSON } from '@/lib/storage';

/**
 * POST /api/draw — Ambil daftar kode kupon yang ELIGIBLE untuk undian.
 *
 * Desain "Stop = kode yang berhenti":
 * - Endpoint ini HANYA mengembalikan daftar kode sah (pool), TIDAK memilih
 *   pemenang dan TIDAK mencatat pending_draws. Layar mengacak cepat kode-kode
 *   asli ini dan menampilkannya; kode yang membeku saat MC menekan Stop itulah
 *   calon pemenang (dikirim ke /api/draw/stop untuk verifikasi & pencatatan).
 * - Penonton melihat KODE KUPON ASLI (bukan angka acak yang berganti saat hasil
 *   dibuka), sehingga tidak ada kesan "settingan".
 *
 * Body: { prizeId: string }
 * Response: { success, codes: string[], audit: { method, pool_size, fetched_at } }
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
    const prizeId = body.prizeId;

    if (!prizeId) {
      return NextResponse.json({ error: 'ID Hadiah wajib diisi' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ error: 'Fitur undian memerlukan Supabase yang dikonfigurasi.' }, { status: 500 });
    }

    // 1. Validasi hadiah dari pengadaan purchases
    const { data: purchases } = await serverSupabase
      .from('purchases')
      .select('*')
      .neq('is_doorprize', false);

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ error: 'Belum ada pengadaan barang doorprize' }, { status: 400 });
    }

    const targetPurchase = purchases.find(
      (p) => p.id === prizeId || p.item_name.trim().toLowerCase() === prizeId.trim().toLowerCase()
    );

    if (!targetPurchase) {
      return NextResponse.json({ error: 'Hadiah tidak ditemukan' }, { status: 404 });
    }

    const targetName = targetPurchase.item_name.trim();
    const sameCategoryPurchases = purchases.filter(
      (p) => p.item_name.trim().toLowerCase() === targetName.toLowerCase()
    );
    const totalStock = sameCategoryPurchases.reduce((acc, p) => acc + p.qty, 0);

    const { data: drawResults } = await serverSupabase.from('draw_results').select('*');
    const drawnCount = (drawResults || []).filter(
      (r) =>
        (r.prize_name && r.prize_name.trim().toLowerCase() === targetName.toLowerCase()) ||
        (r.prize_id && r.prize_id.trim().toLowerCase() === targetName.toLowerCase()) ||
        r.prize_id === targetPurchase.id
    ).length;

    if (drawnCount >= totalStock) {
      return NextResponse.json({ error: `Stok hadiah ${targetName} sudah habis!` }, { status: 400 });
    }

    // 2. Ambil kupon eligible (status 'checkin')
    const { data: eligibleVouchers, error: vErr } = await serverSupabase
      .from('vouchers')
      .select('*')
      .eq('status', 'checkin');

    if (vErr || !eligibleVouchers) {
      throw vErr || new Error('Gagal memuat daftar kupon eligible');
    }

    // 3. Kebijakan undian: maksimal N hadiah per orang (0 = tanpa batas).
    //    Pembeli yang sudah memenangkan N doorprize seluruh kuponnya
    //    dikeluarkan dari pool undian berikutnya. Nilai 0 menonaktifkan
    //    filter ini (undian bebas seperti mengambil kertas di kotak).
    let pool = eligibleVouchers;
    if (SIKUJA_MAX_PRIZES_PER_PERSON > 0) {
      const { data: existingWinners, error: winnersErr } = await serverSupabase
        .from('vouchers')
        .select('transaction_id')
        .in('status', ['menang', 'diklaim']);
      if (winnersErr) throw winnersErr;

      const winCountByTx = new Map<string, number>();
      (existingWinners || []).forEach((w) => {
        winCountByTx.set(w.transaction_id, (winCountByTx.get(w.transaction_id) || 0) + 1);
      });
      pool = eligibleVouchers.filter(
        (v) => (winCountByTx.get(v.transaction_id) || 0) < SIKUJA_MAX_PRIZES_PER_PERSON
      );
    }

    if (pool.length === 0) {
      return NextResponse.json({
        error: 'Tidak ada kode voucher yang eligible (sudah check-in di pos & belum menang)!',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      codes: pool.map((v) => v.code),
      audit: {
        method: 'stop = kode yang tampil (pool server)',
        pool_size: pool.length,
        fetched_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API /draw error:', errorMsg);
    return NextResponse.json({ error: errorMsg || 'Internal Server Error' }, { status: 500 });
  }
}
