import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * POST /api/draw/forfeit — Gugurkan kandidat lalu siap undi ulang.
 *
 * Desain "Stop = kode yang berhenti": saat MC menekan N (Gugurkan & Undi
 * Ulang), kupon yang tampil dianggap SOBEK — status voucher diubah
 * 'forfeited' (tidak akan masuk pool lagi) dan baris pending_draws-nya
 * ditandai 'forfeited' supaya tidak bisa dikonfirmasi. Kupon lain milik orang
 * yang sama tetap ikut diundi, seperti mengambil kertas di kotak sungguhan.
 *
 * Body: { prizeId: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['mc', 'admin']);
    if (auth instanceof NextResponse) return auth;

    if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prizeId, code } = body;

    if (!prizeId || !code) {
      return NextResponse.json({ error: 'Kode voucher dan ID hadiah wajib diisi' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured()) {
      return NextResponse.json({ error: 'Fitur undian memerlukan Supabase yang dikonfigurasi.' }, { status: 500 });
    }

    // 1. Tandai baris kandidat menjadi 'forfeited' supaya tidak bisa dikonfirmasi.
    const { error: pendingErr } = await serverSupabase
      .from('pending_draws')
      .update({ status: 'forfeited' })
      .eq('prize_id', prizeId)
      .eq('voucher_code', code)
      .eq('status', 'pending');
    if (pendingErr) throw pendingErr;

    // 2. Tandai voucher 'forfeited' (dianggap sobek) sehingga tidak pernah
    //    masuk pool lagi (pool hanya mengambil status 'checkin').
    const { error: voucherErr } = await serverSupabase
      .from('vouchers')
      .update({ status: 'forfeited' })
      .eq('code', code)
      .eq('status', 'checkin');
    if (voucherErr) throw voucherErr;

    return NextResponse.json({
      success: true,
      message: `Kupon ${code} digugurkan (dianggap sobek) — undian ulang siap dimulai.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API /draw/forfeit error:', errorMsg);
    return NextResponse.json({ error: errorMsg || 'Internal Server Error' }, { status: 500 });
  }
}
