import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * GET /api/data — Data operasional lengkap (transactions, vouchers, purchases, draw_results).
 * Resilient: kegagalan satu tabel TIDAK menggagalkan semuanya; tabel yang sukses
 * tetap dikirim (syncErrors mencatat kegagalan) supaya sinkronisasi lokal tidak
 * terhapus karena satu query error (mis. kolom yang belum ada di DB).
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
        syncErrors: [],
      });
    }

    const results = await Promise.allSettled([
      serverSupabase.from('transactions').select('*'),
      serverSupabase.from('vouchers').select('*'),
      serverSupabase.from('purchases').select('*').order('purchase_date', { ascending: false }),
      serverSupabase.from('draw_results').select('*'),
    ]);

    const syncErrors: string[] = [];
    const settle = <T>(r: PromiseSettledResult<{ data: T[] | null; error: unknown } | null>, key: string): T[] => {
      if (r.status === 'fulfilled' && r.value && !r.value.error && r.value.data) {
        return r.value.data;
      }
      const reason = r.status === 'rejected' ? r.reason : r.value?.error;
      syncErrors.push(`${key}: ${(reason as Error)?.message || String(reason) || 'query gagal'}`);
      return [];
    };

    return NextResponse.json({
      success: true,
      transactions: settle(results[0], 'transactions'),
      vouchers: settle(results[1], 'vouchers'),
      purchases: settle(results[2], 'purchases'),
      drawResults: settle(results[3], 'draw_results'),
      syncErrors,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /data error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
