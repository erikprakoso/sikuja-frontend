import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import { Prize } from '@/types';

// Admin-only. Replaces the previous client-side direct Supabase writes.
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const prizes: Prize[] = Array.isArray(body.prizes) ? body.prizes : [];

    if (prizes.length === 0) {
      return NextResponse.json({ error: 'Daftar hadiah kosong' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ success: true, count: prizes.length });
    }

    // Remove prizes that no longer exist in the list, then upsert the rest.
    const incomingIds = prizes.map((p) => p.id);
    await serverSupabase.from('prizes').delete().not('id', 'in', incomingIds);

    const { error } = await serverSupabase.from('prizes').upsert(prizes);
    if (error) throw error;

    return NextResponse.json({ success: true, count: prizes.length });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /prizes POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const prizeId = searchParams.get('prizeId');

    if (!prizeId) {
      return NextResponse.json({ error: 'prizeId wajib diisi' }, { status: 400 });
    }

    if (isServerSupabaseConfigured()) {
      const { error } = await serverSupabase.from('prizes').delete().eq('id', prizeId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /prizes DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
