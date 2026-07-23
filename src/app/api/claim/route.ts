import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { claimStagePrize } from '@/lib/services/voucher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = (body.code || '').trim();
    const pin = body.pin || '4444';

    if (!code) {
      return NextResponse.json({ error: 'Kode voucher wajib diisi' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { data: target, error: findErr } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (findErr || !target) {
        return NextResponse.json({ error: `Kode voucher ${code} tidak ditemukan.` }, { status: 404 });
      }

      if (target.status !== 'menang') {
        return NextResponse.json({
          error: `Kode ${code} berstatus '${target.status}'. Hanya kode pemenang yang dapat diklaim!`,
        }, { status: 400 });
      }

      const now = new Date().toISOString();

      // Update voucher status to 'diklaim'
      await supabase
        .from('vouchers')
        .update({ status: 'diklaim', claimed_at: now })
        .eq('code', code);

      // Update draw_result record
      await supabase
        .from('draw_results')
        .update({ claimed: true, claimed_at: now, verifier_pin: pin })
        .eq('voucher_code', code);

      return NextResponse.json({
        success: true,
        message: `Berhasil! Voucher ${code} resmi diklaim & ditandai sudah diambil (sobek digital).`,
      });
    } else {
      const res = claimStagePrize(code, pin);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json(res);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /claim error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
