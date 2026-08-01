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
    const { supplier_name, item_name, qty, price_per_unit, payment_method, note } = body;

    if (!supplier_name || !item_name || !qty || !price_per_unit) {
      return NextResponse.json({ error: 'Data pembelian wajib diisi lengkap' }, { status: 400 });
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return NextResponse.json({ error: 'Jumlah harus angka positif' }, { status: 400 });
    }

    if (typeof price_per_unit !== 'number' || price_per_unit < 0) {
      return NextResponse.json({ error: 'Harga per unit harus angka non-negatif' }, { status: 400 });
    }

    const total_price = qty * price_per_unit;
    const now = new Date().toISOString();

    const purchase = {
      id: 'purch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      supplier_name: supplier_name.trim(),
      item_name: item_name.trim(),
      qty: Math.floor(qty),
      price_per_unit: price_per_unit,
      total_price: total_price,
      purchase_date: new Date().toISOString().slice(0, 10),
      payment_method: payment_method || 'cash',
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
      message: 'Pembelian doorprize berhasil dicatat.',
      purchase: newPurchase,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/purchases POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
