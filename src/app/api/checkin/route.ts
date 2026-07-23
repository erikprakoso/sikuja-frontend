import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkInVoucher, checkInTransactionBatch } from '@/lib/services/voucher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let codeOrToken = (body.codeOrToken || body.code || '').trim();

    if (!codeOrToken) {
      return NextResponse.json({ error: 'Kode voucher atau token transaksi wajib diisi' }, { status: 400 });
    }

    if (codeOrToken.includes('/v/')) {
      codeOrToken = codeOrToken.split('/v/')[1].split('?')[0].split('#')[0];
    }

    if (isSupabaseConfigured()) {
      // Check if codeOrToken is a transaction token (batch checkin)
      const { data: tx } = await supabase
        .from('transactions')
        .select('*')
        .or(`token.eq.${codeOrToken},id.eq.${codeOrToken}`)
        .maybeSingle();

      if (tx) {
        // Batch check-in all vouchers under this transaction
        const now = new Date().toISOString();
        const { data: updatedVouchers, error: uErr } = await supabase
          .from('vouchers')
          .update({ status: 'checkin', checkin_at: now })
          .eq('transaction_id', tx.id)
          .eq('status', 'terbit')
          .select();

        if (uErr) throw uErr;

        const count = updatedVouchers ? updatedVouchers.length : 0;
        return NextResponse.json({
          success: true,
          message: `Berhasil check-in ${count} voucher (dari transaksi E-Voucher).`,
          count,
        });
      }

      // Single voucher check-in by 5-digit code
      const { data: targetVoucher, error: findErr } = await supabase
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
      const { data: updated, error: updateErr } = await supabase
        .from('vouchers')
        .update({ status: 'checkin', checkin_at: now })
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
