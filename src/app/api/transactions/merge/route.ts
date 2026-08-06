import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * POST /api/transactions/merge
 * Menggabungkan satu transaksi (source) ke transaksi lain (target).
 * - Semua voucher milik source dipindah ke target (transaction_id diubah).
 * - qty_fisik, qty_non_fisik, total_harga target dijumlahkan dari source.
 * - Transaksi source dihapus; id yang dipakai adalah id target.
 * Lokal mode (tanpa Supabase): dikerjakan di sisi klien, endpoint mengembalikan sukses.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const sourceId = (body.sourceId || '').toString();
    const targetId = (body.targetId || '').toString();

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: 'ID transaksi source dan target wajib diisi.' },
        { status: 400 }
      );
    }

    if (sourceId === targetId) {
      return NextResponse.json(
        { error: 'Transaksi source dan target tidak boleh sama.' },
        { status: 400 }
      );
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    // Ambil kedua transaksi untuk dihitung total baru.
    const { data: txs, error: fetchErr } = await serverSupabase
      .from('transactions')
      .select('id, qty_fisik, qty_non_fisik, total_harga')
      .in('id', [sourceId, targetId]);

    if (fetchErr) throw fetchErr;

    const source = (txs || []).find((t) => t.id === sourceId);
    const target = (txs || []).find((t) => t.id === targetId);

    if (!source || !target) {
      return NextResponse.json(
        { error: 'Salah satu transaksi tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 1. Pindahkan semua voucher source ke target.
    const { error: voucherErr } = await serverSupabase
      .from('vouchers')
      .update({ transaction_id: targetId })
      .eq('transaction_id', sourceId);

    if (voucherErr) throw voucherErr;

    // 2. Jumlahkan qty & total harga ke target.
    const { error: updateErr } = await serverSupabase
      .from('transactions')
      .update({
        qty_fisik: (target.qty_fisik || 0) + (source.qty_fisik || 0),
        qty_non_fisik: (target.qty_non_fisik || 0) + (source.qty_non_fisik || 0),
        total_harga: (target.total_harga || 0) + (source.total_harga || 0),
      })
      .eq('id', targetId);

    if (updateErr) throw updateErr;

    // 3. Hapus transaksi source.
    const { error: deleteErr } = await serverSupabase
      .from('transactions')
      .delete()
      .eq('id', sourceId);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /transactions/merge error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
