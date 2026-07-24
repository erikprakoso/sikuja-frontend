import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { drawWinnerForPrize } from '@/lib/services/voucher';

/**
 * Cryptographically Secure Random Index Generator
 * Uses Node.js crypto.randomInt() which is CSPRNG-backed (OS-level entropy).
 */
function secureRandomIndex(max: number): number {
  return randomInt(0, max);
}

/**
 * POST /api/draw — Pick a random eligible code (does NOT change status yet).
 * The MC must then confirm or skip (gugur) via /api/draw/confirm.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prizeId = body.prizeId;

    if (!prizeId) {
      return NextResponse.json({ error: 'ID Hadiah wajib diisi' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // 1. Fetch Prize details
      const { data: prize, error: prizeErr } = await supabase
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
      const { data: eligibleVouchers, error: vErr } = await supabase
        .from('vouchers')
        .select('*')
        .eq('status', 'checkin');

      if (vErr || !eligibleVouchers || eligibleVouchers.length === 0) {
        return NextResponse.json({
          error: 'Tidak ada kode voucher yang eligible (sudah check-in di pos & belum menang)!',
        }, { status: 400 });
      }

      // 3. Cryptographically Secure Random Pick (CSPRNG)
      // Status voucher TIDAK diubah — hanya pick acak
      const randomIndex = secureRandomIndex(eligibleVouchers.length);
      const candidate = eligibleVouchers[randomIndex];

      return NextResponse.json({
        success: true,
        candidate, // Still status 'checkin' — not yet a winner
        prize,
        audit: {
          method: 'crypto.randomInt (CSPRNG)',
          pool_size: eligibleVouchers.length,
          selected_index: randomIndex,
          picked_at: new Date().toISOString(),
        },
      });
    } else {
      const result = drawWinnerForPrize(prizeId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /draw error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
