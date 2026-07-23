import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { drawWinnerForPrize } from '@/lib/services/voucher';

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

      // 3. Random pick
      const randomIndex = Math.floor(Math.random() * eligibleVouchers.length);
      const winner = eligibleVouchers[randomIndex];
      const now = new Date().toISOString();

      // 4. Update winner voucher status
      const { error: winErr } = await supabase
        .from('vouchers')
        .update({
          status: 'menang',
          won_at: now,
          prize_id: prize.id,
          prize_name: prize.name,
        })
        .eq('code', winner.code);

      if (winErr) throw winErr;

      // 5. Increment prize drawn_count
      await supabase
        .from('prizes')
        .update({ drawn_count: prize.drawn_count + 1 })
        .eq('id', prize.id);

      // 6. Record draw_result
      const drawResult = {
        id: 'res_' + Date.now(),
        voucher_code: winner.code,
        prize_id: prize.id,
        prize_name: prize.name,
        drawn_at: now,
        claimed: false,
      };

      await supabase.from('draw_results').insert([drawResult]);

      return NextResponse.json({
        success: true,
        winnerVoucher: { ...winner, status: 'menang', won_at: now, prize_name: prize.name },
        prize,
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
