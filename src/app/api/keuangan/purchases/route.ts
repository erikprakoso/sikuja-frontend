import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

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
      const spentDonasi = rows
        .filter((p) => p.funding_source !== 'penjualan_kupon')
        .reduce((acc, p) => acc + (p.total_price ?? 0), 0);
      const spentKupon = rows
        .filter((p) => p.funding_source === 'penjualan_kupon')
        .reduce((acc, p) => acc + (p.total_price ?? 0), 0);

      return NextResponse.json({
        aggregate: {
          total,
          spent_donasi: spentDonasi,
          spent_kupon: spentKupon,
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
    const { item_name, qty, price_per_unit, is_doorprize, funding_source, note } = body;

    if (!item_name || !qty || !price_per_unit) {
      return NextResponse.json({ error: 'Nama item, jumlah, dan harga per unit wajib diisi' }, { status: 400 });
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return NextResponse.json({ error: 'Jumlah harus angka positif' }, { status: 400 });
    }

    if (typeof price_per_unit !== 'number' || price_per_unit < 0) {
      return NextResponse.json({ error: 'Harga per unit harus angka non-negatif' }, { status: 400 });
    }

    const total_price = qty * price_per_unit;
    const isDoorprize = typeof is_doorprize === 'boolean' ? is_doorprize : true;
    const fundingSource = funding_source === 'penjualan_kupon' ? 'penjualan_kupon' : 'donasi';

    const purchase = {
      id: 'purch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      item_name: item_name.trim(),
      qty: Math.floor(qty),
      price_per_unit: price_per_unit,
      total_price: total_price,
      purchase_date: new Date().toISOString().slice(0, 10),
      is_doorprize: isDoorprize,
      funding_source: fundingSource,
      note: note?.trim() || null,
      created_by: auth.name,
    };

    const { data: newPurchase, error } = await serverSupabase
      .from('purchases')
      .insert([purchase])
      .select()
      .single();

    if (error) throw error;

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
    const { id, item_name, qty, price_per_unit, is_doorprize, funding_source, note } = body;

    if (!id || !item_name || !qty || !price_per_unit) {
      return NextResponse.json({ error: 'ID, nama item, jumlah, dan harga per unit wajib diisi' }, { status: 400 });
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return NextResponse.json({ error: 'Jumlah harus angka positif' }, { status: 400 });
    }

    if (typeof price_per_unit !== 'number' || price_per_unit < 0) {
      return NextResponse.json({ error: 'Harga per unit harus angka non-negatif' }, { status: 400 });
    }

    const total_price = qty * price_per_unit;
    const isDoorprize = typeof is_doorprize === 'boolean' ? is_doorprize : true;
    const fundingSource = funding_source === 'penjualan_kupon' ? 'penjualan_kupon' : 'donasi';

    const purchase = {
      item_name: item_name.trim(),
      qty: Math.floor(qty),
      price_per_unit: price_per_unit,
      total_price: total_price,
      purchase_date: new Date().toISOString().slice(0, 10),
      is_doorprize: isDoorprize,
      funding_source: fundingSource,
      note: note?.trim() || null,
      created_by: auth.name,
    };

    const { data: updatedPurchase, error } = await serverSupabase
      .from('purchases')
      .update(purchase)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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
