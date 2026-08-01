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

        // Kumpulkan SEMUA transaksi milik pembeli yang sama (prioritas: no. HP, lalu nama).
        // Contoh: user A beli 10 kupon lalu beli lagi 5 kupon → scan 1 barcode memverifikasi 15 kupon.
        let allTx = [tx];
        if (tx.customer_phone && tx.customer_phone.trim()) {
          const { data: phoneTxs } = await serverSupabase
            .from('transactions')
            .select('id')
            .eq('customer_phone', tx.customer_phone.trim());
          if (phoneTxs && phoneTxs.length > 0) allTx = phoneTxs;
        } else if (tx.customer_name && tx.customer_name.trim()) {
          const { data: nameTxs } = await serverSupabase
            .from('transactions')
            .select('id')
            .eq('customer_name', tx.customer_name.trim());
          if (nameTxs && nameTxs.length > 0) allTx = nameTxs;
        }

        const txIds = allTx.map((t) => t.id);

        // Fetch all vouchers for these transactions to check status
        const { data: allVouchers } = await serverSupabase
          .from('vouchers')
          .select('*')
          .in('transaction_id', txIds);

        const totalInTx = allVouchers ? allVouchers.length : 0;
        const pendingVouchers = allVouchers ? allVouchers.filter((v) => v.status === 'terbit') : [];

        if (totalInTx > 0 && pendingVouchers.length === 0) {
          return NextResponse.json({
            success: true,
            message: `Seluruh ${totalInTx} voucher milik ${tx.customer_name || 'pembeli ini'} sudah berstatus check-in sebelumnya!`,
            count: 0,
          });
        }

        // Batch check-in all vouchers of the customer (atomik: hanya status 'terbit')
        const { data: updatedVouchers, error: uErr } = await serverSupabase
          .from('vouchers')
          .update({ status: 'checkin', checkin_at: now, ...(auth.userId ? { checkin_by: auth.userId } : {}) })
          .in('transaction_id', txIds)
          .eq('status', 'terbit')
          .select();

        if (uErr) throw uErr;

        const count = updatedVouchers ? updatedVouchers.length : 0;
        return NextResponse.json({
          success: true,
          message: `Berhasil check-in ${count} voucher (dari total ${totalInTx}) milik ${tx.customer_name || 'pembeli ini'} via E-Voucher.`,
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
      // Atomik: hanya update baris yang masih 'terbit' sehingga dua petugas yang
      // memindai kode yang sama nyaris bersamaan tidak dua-duanya mendapat "Berhasil".
      const { data: updated, error: updateErr } = await serverSupabase
        .from('vouchers')
        .update({ status: 'checkin', checkin_at: now, ...(auth.userId ? { checkin_by: auth.userId } : {}) })
        .eq('code', codeOrToken)
        .eq('status', 'terbit')
        .select()
        .single();

      if (updateErr) {
        // 0 baris ter-update → sudah di-check-in / status lain oleh petugas lain.
        const { data: current } = await serverSupabase
          .from('vouchers')
          .select('*')
          .eq('code', codeOrToken)
          .maybeSingle();
        if (current) {
          return NextResponse.json({
            success: true,
            message: `Kode voucher ${codeOrToken} sudah berstatus ${current.status} sebelumnya.`,
            voucher: current,
          });
        }
        throw updateErr;
      }

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
