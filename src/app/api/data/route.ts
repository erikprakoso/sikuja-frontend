import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * GET /api/data — Data operasional lengkap (transactions, vouchers, purchases, draw_results).
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
        purchases: [],
        drawResults: [],
      });
    }

    const [txRes, vRes, purRes, dRes] = await Promise.all([
      serverSupabase.from('transactions').select('*'),
      serverSupabase.from('vouchers').select('*'),
      serverSupabase.from('purchases').select('*').order('created_at', { ascending: false }),
      serverSupabase.from('draw_results').select('*'),
    ]);

    return NextResponse.json({
      success: true,
      transactions: txRes.data || [],
      vouchers: vRes.data || [],
      purchases: purRes.data || [],
      drawResults: dRes.data || [],
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /data error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
