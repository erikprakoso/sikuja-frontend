import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { checkInVoucher, checkInTransactionBatch } from '@/lib/services/voucher';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['pos', 'admin']);
    if (auth instanceof NextResponse) return auth;

    if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    let codeOrToken = (body.codeOrToken || body.code || '').trim();

    if (!codeOrToken) {
      return NextResponse.json({ error: 'Kode voucher atau token transaksi wajib diisi' }, { status: 400 });
    }

    if (codeOrToken.includes('/v/')) {
      codeOrToken = codeOrToken.split('/v/')[1].split('?')[0].split('#')[0];
    }

    if (isServerSupabaseConfigured()) {
      // Safe transaction lookup by token or id text string
      let tx = null;
      const { data: txByToken } = await serverSupabase
        .from('transactions')
        .select('*')
        .eq('token', codeOrToken)
        .maybeSingle();

      if (txByToken) {
        tx = txByToken;
      } else {
        const { data: txById } = await serverSupabase
          .from('transactions')
          .select('*')
          .eq('id', codeOrToken)
          .maybeSingle();
        if (txById) tx = txById;
      }

      if (tx) {
        const now = new Date().toISOString();
        
        // Fetch all vouchers for this transaction to check status
        const { data: allVouchers } = await serverSupabase
          .from('vouchers')
          .select('*')
          .eq('transaction_id', tx.id);

        const totalInTx = allVouchers ? allVouchers.length : 0;
        const pendingVouchers = allVouchers ? allVouchers.filter((v) => v.status === 'terbit') : [];

        if (totalInTx > 0 && pendingVouchers.length === 0) {
          return NextResponse.json({
            success: true,
            message: `Seluruh ${totalInTx} voucher dari transaksi ini (${tx.token}) sudah berstatus check-in sebelumnya!`,
            count: 0,
          });
        }

        // Batch check-in all vouchers under this transaction
        const { data: updatedVouchers, error: uErr } = await serverSupabase
          .from('vouchers')
          .update({ status: 'checkin', checkin_at: now, ...(auth.userId ? { checkin_by: auth.userId } : {}) })
          .eq('transaction_id', tx.id)
          .eq('status', 'terbit')
          .select();

        if (uErr) throw uErr;

        const count = updatedVouchers ? updatedVouchers.length : 0;
        return NextResponse.json({
          success: true,
          message: `Berhasil batch check-in ${count} voucher (dari transaksi E-Voucher ${tx.token}).`,
          count,
        });
      }

      // Single voucher check-in by 5-digit code
      const { data: targetVoucher, error: findErr } = await serverSupabase
        .from('vouchers')
        .select('*')
        .eq('code', codeOrToken)
        .maybeSingle();

      if (findErr || !targetVoucher) {
        return NextResponse.json({ error: `Kode voucher ${codeOrToken} tidak ditemukan dalam sistem!` }, { status: 404 });
      }

      if (targetVoucher.status !== 'terbit') {
        return NextResponse.json({
          success: true,
          message: `Kode voucher ${codeOrToken} sudah berstatus ${targetVoucher.status} sebelumnya.`,
          voucher: targetVoucher,
        });
      }

      const now = new Date().toISOString();
      const { data: updated, error: updateErr } = await serverSupabase
        .from('vouchers')
        .update({ status: 'checkin', checkin_at: now, ...(auth.userId ? { checkin_by: auth.userId } : {}) })
        .eq('code', codeOrToken)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        message: `Berhasil check-in voucher ${codeOrToken}! Kode ini sah mengikuti undian.`,
        voucher: updated,
      });
    } else {
      // Local fallback
      const batchRes = checkInTransactionBatch(codeOrToken);
      if (batchRes.success && batchRes.count > 0) {
        return NextResponse.json(batchRes);
      }

      const singleRes = checkInVoucher(codeOrToken);
      if (!singleRes.success) {
        return NextResponse.json({ error: singleRes.message }, { status: 400 });
      }
      return NextResponse.json(singleRes);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /checkin error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
