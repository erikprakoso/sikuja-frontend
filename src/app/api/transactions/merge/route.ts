import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * POST /api/transactions/merge
 * Menggabungkan satu atau lebih transaksi source ke satu transaksi target (base).
 * - Semua voucher milik source dipindah ke target (transaction_id diubah).
 * - qty_fisik, qty_non_fisik, total_harga target dijumlahkan dari semua source.
 * - Transaksi source dihapus; id yang dipakai adalah id target.
 * Lokal mode (tanpa Supabase): dikerjakan di sisi klien, endpoint mengembalikan sukses.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const targetId = (body.targetId || '').toString();
    let sourceIds: string[] = [];
    if (Array.isArray(body.sourceIds)) {
      sourceIds = body.sourceIds.map((id: unknown) => String(id));
    } else if (body.sourceId) {
      sourceIds = [body.sourceId.toString()];
    }

    if (!targetId || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'ID transaksi target dan source wajib diisi.' },
        { status: 400 }
      );
    }

    if (sourceIds.includes(targetId)) {
      return NextResponse.json(
        { error: 'Transaksi target dan source tidak boleh sama.' },
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

    // Ambil transaksi target dan semua source untuk dihitung total baru.
    const { data: txs, error: fetchErr } = await serverSupabase
      .from('transactions')
      .select('id, qty_fisik, qty_non_fisik, total_harga')
      .in('id', [targetId, ...sourceIds]);

    if (fetchErr) throw fetchErr;

    const target = (txs || []).find((t) => t.id === targetId);
    const sources = (txs || []).filter((t) => sourceIds.includes(t.id));

    if (!target) {
      return NextResponse.json(
        { error: 'Transaksi target tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (sources.length !== sourceIds.length) {
      return NextResponse.json(
        { error: 'Salah satu transaksi source tidak ditemukan.' },
        { status: 404 }
      );
    }

    const sumQtyFisik = sources.reduce((acc, s) => acc + (s.qty_fisik || 0), 0);
    const sumQtyNonFisik = sources.reduce((acc, s) => acc + (s.qty_non_fisik || 0), 0);
    const sumTotalHarga = sources.reduce((acc, s) => acc + (s.total_harga || 0), 0);

    // 1. Pindahkan semua voucher milik source ke target.
    const { error: voucherErr } = await serverSupabase
      .from('vouchers')
      .update({ transaction_id: targetId })
      .in('transaction_id', sourceIds);

    if (voucherErr) throw voucherErr;

    // 2. Jumlahkan qty & total harga ke target.
    const { error: updateErr } = await serverSupabase
      .from('transactions')
      .update({
        qty_fisik: (target.qty_fisik || 0) + sumQtyFisik,
        qty_non_fisik: (target.qty_non_fisik || 0) + sumQtyNonFisik,
        total_harga: (target.total_harga || 0) + sumTotalHarga,
      })
      .eq('id', targetId);

    if (updateErr) throw updateErr;

    // 3. Hapus semua transaksi source.
    const { error: deleteErr } = await serverSupabase
      .from('transactions')
      .delete()
      .in('id', sourceIds);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /transactions/merge error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
