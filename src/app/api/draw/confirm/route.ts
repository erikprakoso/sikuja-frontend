import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/draw/confirm — Confirm the drawn candidate as the actual winner.
 * This is called by the MC when the person comes forward on stage.
 * 
 * Body: { code: string, prizeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, prizeId } = body;

    if (!code || !prizeId) {
      return NextResponse.json({ error: 'Kode voucher dan ID hadiah wajib diisi' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase belum dikonfigurasi' }, { status: 500 });
    }

    // 1. Verify the voucher still has status 'checkin' (hasn't been confirmed by another process)
    const { data: voucher, error: vErr } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .single();

    if (vErr || !voucher) {
      return NextResponse.json({ error: `Kode ${code} tidak ditemukan` }, { status: 404 });
    }

    if (voucher.status !== 'checkin') {
      return NextResponse.json({
        error: `Kode ${code} sudah berstatus "${voucher.status}" — tidak bisa dikonfirmasi ulang.`,
      }, { status: 400 });
    }

    // 2. Fetch prize & verify stock
    const { data: prize, error: pErr } = await supabase
      .from('prizes')
      .select('*')
      .eq('id', prizeId)
      .single();

    if (pErr || !prize) {
      return NextResponse.json({ error: 'Hadiah tidak ditemukan' }, { status: 404 });
    }

    // 3. Atomic increment with optimistic lock — prevents over-draw
    const { data: updatedPrize, error: incErr } = await supabase
      .from('prizes')
      .update({ drawn_count: prize.drawn_count + 1 })
      .eq('id', prize.id)
      .eq('drawn_count', prize.drawn_count)
      .lt('drawn_count', prize.stock)
      .select()
      .maybeSingle();

    if (incErr || !updatedPrize) {
      return NextResponse.json({
        error: `Stok hadiah "${prize.name}" sudah habis!`,
      }, { status: 409 });
    }

    // 4. Mark voucher as winner
    const now = new Date().toISOString();
    await supabase
      .from('vouchers')
      .update({
        status: 'menang',
        won_at: now,
        prize_id: prize.id,
        prize_name: prize.name,
      })
      .eq('code', code);

    // 5. Record draw_result
    const drawResult = {
      id: 'res_' + Date.now(),
      voucher_code: code,
      prize_id: prize.id,
      prize_name: prize.name,
      drawn_at: now,
      claimed: false,
    };

    await supabase.from('draw_results').insert([drawResult]);

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
