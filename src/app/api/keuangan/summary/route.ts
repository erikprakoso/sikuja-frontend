import { NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';

const CACHE_TTL_MS = 30000;

let cache: { payload: unknown; expiresAt: number } | null = null;

/**
 * Ringkasan keuangan publik untuk transparansi (tanpa auth).
 * Hanya mengembalikan angka agregat — tidak ada PII (nama/telepon donatur, dll).
 */
export async function GET() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return NextResponse.json(cache.payload);
  }

  try {
    if (!isServerSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase belum dikonfigurasi.' },
        { status: 500 }
      );
    }

    const [{ data: purchases }, { data: donations }, { data: transactions }] = await Promise.all([
      serverSupabase.from('purchases').select('total_price, funding_source'),
      serverSupabase.from('donations').select('amount'),
      serverSupabase.from('transactions').select('total_harga'),
    ]);

    if (purchases === null || donations === null || transactions === null) {
      throw new Error('Gagal mengambil data ringkasan keuangan');
    }

    const rows = purchases ?? [];
    let spentDonasi = 0;
    let spentKupon = 0;
    let spentBarang = 0;
    for (const p of rows) {
      const price = p.total_price ?? 0;
      if (p.funding_source === 'penjualan_kupon') spentKupon += price;
      else if (p.funding_source === 'donasi_barang') spentBarang += price;
      else spentDonasi += price;
    }

    const totalSpent = spentDonasi + spentKupon;
    const totalSpentBarang = spentBarang;
    const purchaseCount = rows.length;
    const totalDonations = (donations ?? []).reduce((acc, d) => acc + (d.amount ?? 0), 0);
    const voucherSales = (transactions ?? []).reduce((acc, t) => acc + (t.total_harga ?? 0), 0);

    const sisaDonasi = totalDonations - spentDonasi;
    const sisaKupon = voucherSales - spentKupon;
    const sisaKas = sisaDonasi + sisaKupon;

    const payload = {
      summary: {
        totalSpent,
        totalSpentBarang,
        sisaDonasi,
        totalDonations,
        sisaKupon,
        voucherSales,
        sisaKas,
        purchaseCount,
      },
    };

    cache = { payload, expiresAt: now + CACHE_TTL_MS };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/summary GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
