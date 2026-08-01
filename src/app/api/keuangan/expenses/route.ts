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

    const { data: expenses, error } = await serverSupabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ expenses });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/expenses GET error:', error);
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
    const { category, item_name, qty, price_per_unit, payment_method, note } = body;

    if (!item_name || !qty || !price_per_unit) {
      return NextResponse.json({ error: 'Data pengeluaran wajib diisi lengkap' }, { status: 400 });
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return NextResponse.json({ error: 'Jumlah harus angka positif' }, { status: 400 });
    }

    if (typeof price_per_unit !== 'number' || price_per_unit < 0) {
      return NextResponse.json({ error: 'Harga per unit harus angka non-negatif' }, { status: 400 });
    }

    const total_price = qty * price_per_unit;
    const now = new Date().toISOString();

    const expense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      category: category || 'umum',
      item_name: item_name.trim(),
      qty: Math.floor(qty),
      price_per_unit: price_per_unit,
      total_price: total_price,
      expense_date: new Date().toISOString().slice(0, 10),
      payment_method: payment_method || 'cash',
      note: note?.trim() || null,
      approved_by: auth.name,
      created_by: auth.name,
    };

    const { data: newExpense, error } = await serverSupabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran biaya berhasil dicatat.',
      expense: newExpense,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/expenses POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
