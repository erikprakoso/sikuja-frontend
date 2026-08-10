import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { drawWinnerForPrize } from '@/lib/services/voucher';
import { requireAuth } from '@/lib/server-auth';
import { SIKUJA_MAX_PRIZES_PER_PERSON } from '@/lib/storage';

/**
 * Cryptographically Secure Random Index Generator
 * Uses Node.js crypto.randomInt() which is CSPRNG-backed (OS-level entropy).
 */
function secureRandomIndex(max: number): number {
  return randomInt(0, max);
}

/**
 * POST /api/draw — Pick a random eligible code and RECORD it as pending.
 * Status voucher TIDAK diubah; MC harus konfirmasi/gugur via /api/draw/confirm
 * (yang wajib mengacu ke kandidat yang tercatat di sini).
 *
 * Body: { prizeId: string, excludeCode?: string }
 * excludeCode dipakai saat "Gugurkan & Undi Ulang": menandai kandidat lama
 * sebagai forfeited dan mengecualikan SEMUA kupon milik pembeli yang sama.
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
    const excludeCode = typeof body.excludeCode === 'string' ? body.excludeCode.trim() : '';

    if (!prizeId) {
      return NextResponse.json({ error: 'ID Hadiah wajib diisi' }, { status: 400 });
    }

    if (isServerSupabaseConfigured()) {
      // 1. Fetch Prize details from Purchases & Draw Results
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

      const prize = {
        id: targetPurchase.id,
        name: targetName,
        stock: totalStock,
        drawn_count: drawnCount,
      };

      // 2. Fetch eligible vouchers (status == 'checkin')
      const { data: eligibleVouchers, error: vErr } = await serverSupabase
        .from('vouchers')
        .select('*')
        .eq('status', 'checkin');

      if (vErr || !eligibleVouchers || eligibleVouchers.length === 0) {
        return NextResponse.json({
          error: 'Tidak ada kode voucher yang eligible (sudah check-in di pos & belum menang)!',
        }, { status: 400 });
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

      // 4. Undian ulang setelah gugur: kecualikan SEMUA kupon milik pembeli yang
      //    baru gugur (satu transaksi = satu pembeli), agar orang yang sama
      //    tidak langsung terpilih lagi pada undian berikutnya.
      if (excludeCode) {
        const { data: forfeitedVoucher } = await serverSupabase
          .from('vouchers')
          .select('transaction_id')
          .eq('code', excludeCode)
          .maybeSingle();

        if (forfeitedVoucher) {
          // Tandai kandidat lama yang digugurkan supaya tidak bisa dikonfirmasi lagi.
          await serverSupabase
            .from('pending_draws')
            .update({ status: 'forfeited' })
            .eq('prize_id', prize.id)
            .eq('voucher_code', excludeCode)
            .eq('status', 'pending');

          // Kupon yang digugurkan dianggap HANGUS: ubah status voucher sehingga
          // tidak lagi masuk pool undian mana pun (pool hanya mengambil status 'checkin').
          const { error: forfeitErr } = await serverSupabase
            .from('vouchers')
            .update({ status: 'forfeited' })
            .eq('code', excludeCode)
            .eq('status', 'checkin');
          if (forfeitErr) {
            console.error('API /draw: gagal menandai voucher gugur:', forfeitErr.message);
          }

          pool = pool.filter((v) => v.transaction_id !== forfeitedVoucher.transaction_id);
        }
      }

      if (pool.length === 0) {
        return NextResponse.json(
          { error: 'Tidak ada kupon sah tersisa untuk diundi ulang.' },
          { status: 400 }
        );
      }

      // 4. Cryptographically Secure Random Pick (CSPRNG) — status voucher TIDAK diubah.
      const randomIndex = secureRandomIndex(pool.length);
      const candidate = pool[randomIndex];

      // 5. Catat kandidat di pending_draws. Konfirmasi wajib mengacu ke baris ini
      //    sehingga hanya kode yang benar-benar tampil di layar yang bisa menang.
      const { error: pendingErr } = await serverSupabase.from('pending_draws').insert([
        {
          prize_id: prize.id,
          voucher_code: candidate.code,
          status: 'pending',
          created_at: new Date().toISOString(),
          ...(auth.userId ? { created_by: auth.userId } : {}),
        },
      ]);
      if (pendingErr) throw pendingErr;

      return NextResponse.json({
        success: true,
        candidate,
        prize,
        audit: {
          method: 'crypto.randomInt (CSPRNG)',
          pool_size: pool.length,
          selected_index: randomIndex,
          picked_at: new Date().toISOString(),
        },
      });
    } else {
      const result = drawWinnerForPrize(prizeId, excludeCode);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API /draw error:', errorMsg);
    return NextResponse.json({ error: errorMsg || 'Internal Server Error' }, { status: 500 });
  }
}
