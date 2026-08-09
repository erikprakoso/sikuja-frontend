import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import type { Voucher } from '@/types';

/**
 * GET /api/vouchers/by-transaction/[id]
 * Mengambil semua voucher milik SATU transaksi (untuk cetak ulang struk).
 * Dipanggil on-demand dari tabel admin — tabel utama tetap berbasis transactions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID transaksi tidak valid' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ success: true, vouchers: [] });
    }

    const { data: vouchers, error } = await serverSupabase
      .from('vouchers')
      .select('*')
      .eq('transaction_id', id)
      .order('code', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, vouchers: (vouchers as Voucher[]) || [] });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /vouchers/by-transaction error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
