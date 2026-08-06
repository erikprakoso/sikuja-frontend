import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * Total donasi (opsional exclude id) & total pengeluaran bersumber Donasi.
 * Dipakai untuk memastikan edit/hapus donasi tidak membuat saldo donasi negatif.
 */
async function getDonasiBalanceInfo(excludeId?: string) {
  const [{ data: donations }, { data: purchases }] = await Promise.all([
    serverSupabase.from('donations').select('id, amount'),
    serverSupabase.from('purchases').select('total_price, funding_source'),
  ]);

  const totalDonasi = (donations ?? [])
    .filter((d) => d.id !== excludeId)
    .reduce((acc, d) => acc + (d.amount ?? 0), 0);
  const spentDonasi = (purchases ?? [])
    .filter((p) => p.funding_source !== 'penjualan_kupon')
    .reduce((acc, p) => acc + (p.total_price ?? 0), 0);

  return { totalDonasi, spentDonasi };
}

function assertBalanceNotNegative(newTotalDonasi: number, spentDonasi: number): NextResponse | null {
  if (spentDonasi > newTotalDonasi) {
    return NextResponse.json(
      {
        error:
          `Sisa Saldo Donasi & Sponsor akan menjadi NEGATIF.\n` +
          `Total Pengeluaran (Donasi) Terpakai: Rp${spentDonasi.toLocaleString('id-ID')}\n` +
          `Total Donasi Setelah Perubahan: Rp${Math.max(0, newTotalDonasi).toLocaleString('id-ID')}\n\n` +
          `Hapus/ubah pengeluaran bersumber Donasi terlebih dahulu.`,
      },
      { status: 400 }
    );
  }
  return null;
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
      const { data: amounts, error } = await serverSupabase
        .from('donations')
        .select('amount');

      if (error) throw error;

      const total = (amounts ?? []).reduce((acc, d) => acc + (d.amount ?? 0), 0);
      return NextResponse.json({
        aggregate: { total, count: (amounts ?? []).length },
      });
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
    const { donor_name, donor_phone, amount, note } = body;

    if (!donor_name || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Nama donatur dan jumlah wajib diisi' }, { status: 400 });
    }

    if (amount < 0) {
      return NextResponse.json({ error: 'Jumlah donasi tidak boleh negatif' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const donation = {
      id: 'don_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      donor_name: donor_name.trim(),
      donor_phone: donor_phone?.trim() || null,
      amount: Math.floor(amount),
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
    const { id, donor_name, donor_phone, amount, note } = body;

    if (!id || !donor_name || typeof amount !== 'number') {
      return NextResponse.json({ error: 'ID, nama donatur, dan jumlah wajib diisi' }, { status: 400 });
    }

    if (amount < 0) {
      return NextResponse.json({ error: 'Jumlah donasi tidak boleh negatif' }, { status: 400 });
    }

    // Jangan biarkan pengurangan nominal membuat saldo donasi negatif
    const info = await getDonasiBalanceInfo(id);
    const insufficient = assertBalanceNotNegative(info.totalDonasi + Math.floor(amount), info.spentDonasi);
    if (insufficient) return insufficient;

    const donation = {
      donor_name: donor_name.trim(),
      donor_phone: donor_phone?.trim() || null,
      amount: Math.floor(amount),
      note: note?.trim() || null,
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

    // Jangan biarkan penghapusan membuat saldo donasi negatif
    const info = await getDonasiBalanceInfo(id);
    const insufficient = assertBalanceNotNegative(info.totalDonasi, info.spentDonasi);
    if (insufficient) return insufficient;

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
