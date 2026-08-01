import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * GET /api/data — Data operasional lengkap (transactions, vouchers, prizes, draw_results).
 * WAJIB login (sembarang role). Anonim dapat 401 dan tidak akan pernah men-download
 * PII peserta (nama, no. HP, token) ke browser publik.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        transactions: [],
        vouchers: [],
        prizes: [],
        drawResults: [],
      });
    }

    const [txRes, vRes, pRes, dRes] = await Promise.all([
      serverSupabase.from('transactions').select('*'),
      serverSupabase.from('vouchers').select('*'),
      serverSupabase.from('prizes').select('*').order('order_num', { ascending: true }),
      serverSupabase.from('draw_results').select('*'),
    ]);

    return NextResponse.json({
      success: true,
      transactions: txRes.data || [],
      vouchers: vRes.data || [],
      prizes: pRes.data || [],
      drawResults: dRes.data || [],
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /data error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
