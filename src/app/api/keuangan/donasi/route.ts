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

    const { data: donations, error } = await serverSupabase
      .from('donations')
      .select('*')
      .order('received_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ donations });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/donasi GET error:', error);
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
    const { donor_name, donor_phone, amount, type, source, note } = body;

    if (!donor_name || !amount) {
      return NextResponse.json({ error: 'Nama donatur dan jumlah wajib diisi' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Jumlah donasi harus angka positif' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const donation = {
      id: 'don_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      donor_name: donor_name.trim(),
      donor_phone: donor_phone?.trim() || null,
      amount: Math.floor(amount),
      type: type || 'tunai',
      source: source || 'umum',
      note: note?.trim() || null,
      received_by: auth.name,
      received_at: now,
    };

    const { data: newDonation, error } = await serverSupabase
      .from('donations')
      .insert([donation])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Donasi berhasil dicatat.',
      donation: newDonation,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/donasi POST error:', error);
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
    const { id, donor_name, donor_phone, amount, type, source, note } = body;

    if (!id || !donor_name || !amount) {
      return NextResponse.json({ error: 'ID, nama donatur, dan jumlah wajib diisi' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Jumlah donasi harus angka positif' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const donation = {
      donor_name: donor_name.trim(),
      donor_phone: donor_phone?.trim() || null,
      amount: Math.floor(amount),
      type: type || 'tunai',
      source: source || 'umum',
      note: note?.trim() || null,
      received_by: auth.name,
    };

    const { data: updatedDonation, error } = await serverSupabase
      .from('donations')
      .update(donation)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Donasi berhasil diupdate.',
      donation: updatedDonation,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/donasi PUT error:', error);
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
      return NextResponse.json({ error: 'ID donasi wajib diisi' }, { status: 400 });
    }

    const { error } = await serverSupabase.from('donations').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Donasi berhasil dihapus.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /keuangan/donasi DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
