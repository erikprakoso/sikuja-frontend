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

    // Paginasi penuh: PostgREST memotong respons default di 1000 baris,
    // sehingga tanpa loop ini voucher/transaksi terbaru hilang dari cache lokal.
    const PAGE_SIZE = 1000;

    const fetchAll = async <T>(table: string, order?: { column: string; ascending?: boolean }) => {
      const rows: T[] = [];
      for (let start = 0; ; start += PAGE_SIZE) {
        let query = serverSupabase
          .from(table)
          .select('*')
          .range(start, start + PAGE_SIZE - 1);
        if (order) {
          query = query.order(order.column, { ascending: order.ascending ?? true });
        }
        const { data, error } = await query;
        if (error) return { data: rows, error };
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < PAGE_SIZE) break;
      }
      return { data: rows, error: null };
    };

    const results = await Promise.allSettled([
      fetchAll<Record<string, unknown>>('transactions', { column: 'created_at' }),
      fetchAll<Record<string, unknown>>('vouchers', { column: 'created_at' }),
      fetchAll<Record<string, unknown>>('purchases', { column: 'purchase_date', ascending: false }),
      fetchAll<Record<string, unknown>>('draw_results', { column: 'drawn_at' }),
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
