import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { drawWinnerForPrize } from '@/lib/services/voucher';
import { requireAuth } from '@/lib/server-auth';

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
      // 1. Fetch Prize details
      const { data: prize, error: prizeErr } = await serverSupabase
        .from('prizes')
        .select('*')
        .eq('id', prizeId)
        .single();

      if (prizeErr || !prize) {
        return NextResponse.json({ error: 'Hadiah tidak ditemukan' }, { status: 404 });
      }

      if (prize.drawn_count >= prize.stock) {
        return NextResponse.json({ error: `Stok hadiah ${prize.name} sudah habis!` }, { status: 400 });
      }

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

      // 3. Undian ulang setelah gugur: kecualikan SEMUA kupon milik pembeli yang
      //    baru gugur (satu transaksi = satu pembeli), agar orang yang sama
      //    tidak langsung terpilih lagi pada undian berikutnya.
      let pool = eligibleVouchers;
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

          pool = eligibleVouchers.filter((v) => v.transaction_id !== forfeitedVoucher.transaction_id);
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
      const result = drawWinnerForPrize(prizeId);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /draw error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
