import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { checkInVoucher, checkInTransactionBatch, format5DigitCode } from '@/lib/services/voucher';
import { requireAuth } from '@/lib/server-auth';
import type { Transaction } from '@/types';

const MIN_PHONE_DIGITS = 8;

async function findTransactionByTokenOrId(value: string): Promise<Transaction | null> {
  const { data: byToken } = await serverSupabase
    .from('transactions')
    .select('*')
    .eq('token', value)
    .maybeSingle();
  if (byToken) return byToken as Transaction;

  const { data: byId } = await serverSupabase
    .from('transactions')
    .select('*')
    .eq('id', value)
    .maybeSingle();
  return (byId as Transaction) || null;
}

async function findTransactionByPhone(phone: string): Promise<Transaction | null> {
  const clean = phone.replace(/\D/g, '');
  for (const cand of [phone, clean]) {
    const { data } = await serverSupabase
      .from('transactions')
      .select('*')
      .eq('customer_phone', cand)
      .limit(1)
      .maybeSingle();
    if (data) return data as Transaction;
  }
  return null;
}

async function findTransactionByName(name: string): Promise<Transaction | null> {
  const { data } = await serverSupabase
    .from('transactions')
    .select('*')
    .ilike('customer_name', name.trim())
    .limit(1)
    .maybeSingle();
  return (data as Transaction) || null;
}

async function singleVoucherCheckin(code: string, userId?: string | null) {
  const { data: targetVoucher, error: findErr } = await serverSupabase
    .from('vouchers')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (findErr || !targetVoucher) {
    return NextResponse.json({ error: `Kode voucher ${code} tidak ditemukan dalam sistem!` }, { status: 404 });
  }

  if (targetVoucher.status !== 'terbit') {
    return NextResponse.json({
      success: true,
      message: `Kode voucher ${code} sudah berstatus ${targetVoucher.status} sebelumnya.`,
      voucher: targetVoucher,
    });
  }

  const now = new Date().toISOString();
  // Atomik: hanya update baris yang masih 'terbit' sehingga dua petugas yang
  // memindai kode yang sama nyaris bersamaan tidak dua-duanya mendapat "Berhasil".
  const { data: updated, error: updateErr } = await serverSupabase
    .from('vouchers')
    .update({ status: 'checkin', checkin_at: now, ...(userId ? { checkin_by: userId } : {}) })
    .eq('code', code)
    .eq('status', 'terbit')
    .select()
    .single();

  if (updateErr) {
    const { data: current } = await serverSupabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (current) {
      return NextResponse.json({
        success: true,
        message: `Kode voucher ${code} sudah berstatus ${current.status} sebelumnya.`,
        voucher: current,
      });
    }
    throw updateErr;
  }

  return NextResponse.json({
    success: true,
    message: `Berhasil check-in voucher ${code}! Kode ini sah mengikuti undian.`,
    voucher: updated,
  });
}

async function batchCheckinFromTransaction(tx: Transaction, userId?: string | null) {
  const now = new Date().toISOString();

  // Kumpulkan SEMUA transaksi milik pembeli yang sama (prioritas: no. HP, lalu nama).
  // Contoh: user A beli 10 kupon lalu beli lagi 5 kupon → input 1 kode memverifikasi 15 kupon.
  let allTx: { id: string }[] = [tx];
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
    .update({ status: 'checkin', checkin_at: now, ...(userId ? { checkin_by: userId } : {}) })
    .in('transaction_id', txIds)
    .eq('status', 'terbit')
    .select();

  if (uErr) throw uErr;

  const count = updatedVouchers ? updatedVouchers.length : 0;
  return NextResponse.json({
    success: true,
    message: `Berhasil check-in ${count} voucher (dari total ${totalInTx}) milik ${tx.customer_name || 'pembeli ini'}.`,
    count,
  });
}

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
    let input = (body.codeOrToken || body.code || '').trim();

    if (!input) {
      return NextResponse.json({ error: 'Kode voucher atau token transaksi wajib diisi' }, { status: 400 });
    }

    if (input.includes('/v/')) {
      input = input.split('/v/')[1].split('?')[0].split('#')[0];
    }

    if (!isServerSupabaseConfigured()) {
      // Local fallback (demo/offline): batch mencakup token, id, kode, HP, & nama.
      const batchRes = checkInTransactionBatch(input);
      if (batchRes.success && batchRes.count > 0) {
        return NextResponse.json(batchRes);
      }

      const singleRes = checkInVoucher(input);
      if (!singleRes.success) {
        return NextResponse.json({ error: singleRes.message }, { status: 400 });
      }
      return NextResponse.json(singleRes);
    }

    // 1) Token / ID transaksi → batch
    let tx = await findTransactionByTokenOrId(input);

    // 2) No. HP (8+ digit) → cari transaksi pemilik → batch
    if (!tx && input.replace(/\D/g, '').length >= MIN_PHONE_DIGITS) {
      tx = await findTransactionByPhone(input);
    }

    // 3) Nama pemilik (ada huruf) → cari transaksi → batch
    if (!tx && /[a-zA-Z]/.test(input)) {
      tx = await findTransactionByName(input);
    }

    // 4) Kode 5-digit → temukan transaksi terkait → verifikasi SEMUA kupon
    //    yang berelasi sekaligus (bukan satu-satu).
    if (!tx) {
      const code = format5DigitCode(input);
      if (code) {
        const { data: voucher } = await serverSupabase
          .from('vouchers')
          .select('*')
          .eq('code', code)
          .maybeSingle();

        if (voucher) {
          if (voucher.transaction_id) {
            const { data: voucherTx } = await serverSupabase
              .from('transactions')
              .select('*')
              .eq('id', voucher.transaction_id)
              .maybeSingle();
            tx = voucherTx || null;
          } else {
            // Kupon yatim tanpa transaksi → fallback single check-in.
            return singleVoucherCheckin(code, auth.userId);
          }
        }
      }
    }

    if (!tx) {
      return NextResponse.json(
        { error: `Kode / token transaksi "${input}" tidak ditemukan dalam sistem!` },
        { status: 404 }
      );
    }

    return batchCheckinFromTransaction(tx, auth.userId);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /checkin error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
