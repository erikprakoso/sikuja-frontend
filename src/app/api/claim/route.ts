import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { claimStagePrize } from '@/lib/services/voucher';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['verifikator', 'admin']);
    if (auth instanceof NextResponse) return auth;

    if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const code = (body.code || '').trim();

    if (!code) {
      return NextResponse.json({ error: 'Kode voucher wajib diisi' }, { status: 400 });
    }

    if (isServerSupabaseConfigured()) {
      const { data: target, error: findErr } = await serverSupabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (findErr || !target) {
        return NextResponse.json({ error: `Kode voucher ${code} tidak ditemukan.` }, { status: 404 });
      }

      if (target.status !== 'menang') {
        return NextResponse.json({
          error: `Kode ${code} berstatus '${target.status}'. Hanya kode pemenang yang dapat diklaim!`,
        }, { status: 400 });
      }

      const now = new Date().toISOString();

      // Update voucher status to 'diklaim' secara ATOMIK (hanya jika masih 'menang').
      // Mencegah race condition: dua verifikator klaim kode sama bersamaan.
      const { data: updatedVoucher, error: voucherErr } = await serverSupabase
        .from('vouchers')
        .update({ status: 'diklaim', claimed_at: now })
        .eq('code', code)
        .eq('status', 'menang')
        .select()
        .maybeSingle();

      if (voucherErr) throw voucherErr;
      if (!updatedVoucher) {
        return NextResponse.json({
          error: `Kode ${code} sudah diklaim oleh verifikator lain atau status sudah berubah.`,
        }, { status: 409 });
      }

      // Update draw_result record
      const { error: drawErr } = await serverSupabase
        .from('draw_results')
        .update({ claimed: true, claimed_at: now, verifier_name: auth.name })
        .eq('voucher_code', code);

      if (drawErr) {
        // Rollback voucher ke 'menang' jika gagal update draw_results
        await serverSupabase
          .from('vouchers')
          .update({ status: 'menang', claimed_at: null })
          .eq('code', code);
        throw drawErr;
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil! Voucher ${code} resmi diklaim & ditandai sudah diambil (sobek digital).`,
      });
    } else {
      const res = claimStagePrize(code, auth.name);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json(res);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /claim error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
