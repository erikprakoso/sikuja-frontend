import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import { computePrizesFromPurchases } from '@/lib/storage';

/**
 * GET /api/keuangan/doorprize — Kategori hadiah & stok + jumlah peserta eligible,
 * dihitung SERVER-SIDE dari tabel purchases + draw_results (bukan localStorage).
 * Agar layar undian selalu akurat walau halaman admin lain menambah data.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['mc', 'admin']);
    if (auth instanceof NextResponse) return auth;

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ prizes: [], eligibleCount: 0 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const [{ data: purchases }, { data: drawResults }, { data: vouchers }] = await Promise.all([
      serverSupabase.from('purchases').select('*').order('purchase_date', { ascending: false }),
      serverSupabase.from('draw_results').select('*'),
      serverSupabase.from('vouchers').select('status'),
    ]);

    const prizes = computePrizesFromPurchases(purchases || [], drawResults || []);
    const eligibleCount = (vouchers || []).filter((v) => v.status === 'checkin').length;

    return NextResponse.json({ prizes, eligibleCount });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/doorprize GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
