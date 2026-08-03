import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * Jalankan insert/update pembelian via RPC atomik di Postgres.
 * RPC memeriksa saldo & menulis dalam SATU transaksi (anti overspend concurrent).
 */
async function upsertPurchase(params: {
  p_id: string | null;
  p_item_name: string;
  p_qty: number;
  p_price_per_unit: number;
  p_is_doorprize: boolean;
  p_funding_source: string;
  p_donor_name: string | null;
  p_note: string | null;
  p_created_by?: string;
}) {
  const { data, error } = await serverSupabase.rpc('upsert_purchase', params);
  return { data, error };
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const aggregate = searchParams.get('aggregate') === 'true';

    if (aggregate) {
      const { data: prices, error } = await serverSupabase
        .from('purchases')
        .select('total_price, funding_source');

      if (error) throw error;

      const rows = prices ?? [];
      const total = rows.reduce((acc, p) => acc + (p.total_price ?? 0), 0);
      const spentBarang = rows
        .filter((p) => p.funding_source === 'donasi_barang')
        .reduce((acc, p) => acc + (p.total_price ?? 0), 0);
      const spentDonasi = rows
        .filter((p) => p.funding_source !== 'penjualan_kupon' && p.funding_source !== 'donasi_barang')
        .reduce((acc, p) => acc + (p.total_price ?? 0), 0);
      const spentKupon = rows
        .filter((p) => p.funding_source === 'penjualan_kupon')
        .reduce((acc, p) => acc + (p.total_price ?? 0), 0);

      return NextResponse.json({
        aggregate: {
          total,
          spent_donasi: spentDonasi,
          spent_kupon: spentKupon,
          spent_barang: spentBarang,
          count: rows.length,
        },
      });
    }

    const { data: purchases, error } = await serverSupabase
      .from('purchases')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ purchases });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/purchases GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { item_name, qty, price_per_unit, is_doorprize, funding_source, donor_name, note } = body;

    if (!item_name || !qty) {
      return NextResponse.json({ error: 'Nama item dan jumlah wajib diisi' }, { status: 400 });
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return NextResponse.json({ error: 'Jumlah harus angka positif' }, { status: 400 });
    }

    if (price_per_unit !== undefined && (typeof price_per_unit !== 'number' || price_per_unit < 0)) {
      return NextResponse.json({ error: 'Harga per unit harus angka non-negatif' }, { status: 400 });
    }

    const isDoorprize = typeof is_doorprize === 'boolean' ? is_doorprize : true;
    const fundingSource = funding_source === 'penjualan_kupon' || funding_source === 'donasi_barang' ? funding_source : 'donasi';

    if (fundingSource === 'donasi_barang' && !donor_name?.trim()) {
      return NextResponse.json({ error: 'Nama donatur wajib diisi untuk donasi barang' }, { status: 400 });
    }

    const { data: newPurchase, error } = await upsertPurchase({
      p_id: null,
      p_item_name: item_name.trim(),
      p_qty: Math.floor(qty),
      p_price_per_unit: price_per_unit ?? 0,
      p_is_doorprize: isDoorprize,
      p_funding_source: fundingSource,
      p_donor_name: donor_name?.trim() || null,
      p_note: note?.trim() || null,
      p_created_by: auth.name,
    });

    if (error) {
      console.error('API /keuangan/purchases POST upsert error:', error);
      return NextResponse.json(
        { error: (error as { message?: string }).message || 'Gagal menyimpan pembelian' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pembelian berhasil dicatat.',
      purchase: newPurchase,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/purchases POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, item_name, qty, price_per_unit, is_doorprize, funding_source, donor_name, note } = body;

    if (!id || !item_name || !qty) {
      return NextResponse.json({ error: 'ID, nama item, dan jumlah wajib diisi' }, { status: 400 });
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return NextResponse.json({ error: 'Jumlah harus angka positif' }, { status: 400 });
    }

    if (price_per_unit !== undefined && (typeof price_per_unit !== 'number' || price_per_unit < 0)) {
      return NextResponse.json({ error: 'Harga per unit harus angka non-negatif' }, { status: 400 });
    }

    const isDoorprize = typeof is_doorprize === 'boolean' ? is_doorprize : true;
    const fundingSource = funding_source === 'penjualan_kupon' || funding_source === 'donasi_barang' ? funding_source : 'donasi';

    if (fundingSource === 'donasi_barang' && !donor_name?.trim()) {
      return NextResponse.json({ error: 'Nama donatur wajib diisi untuk donasi barang' }, { status: 400 });
    }

    const { data: updatedPurchase, error } = await upsertPurchase({
      p_id: id,
      p_item_name: item_name.trim(),
      p_qty: Math.floor(qty),
      p_price_per_unit: price_per_unit ?? 0,
      p_is_doorprize: isDoorprize,
      p_funding_source: fundingSource,
      p_donor_name: donor_name?.trim() || null,
      p_note: note?.trim() || null,
      p_created_by: auth.name,
    });

    if (error) {
      console.error('API /keuangan/purchases PUT upsert error:', error);
      return NextResponse.json(
        { error: (error as { message?: string }).message || 'Gagal menyimpan pembelian' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pembelian berhasil diupdate.',
      purchase: updatedPurchase,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/purchases PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pembelian wajib diisi' }, { status: 400 });
    }

    const { error } = await serverSupabase.from('purchases').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Pembelian berhasil dihapus.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/purchases DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
