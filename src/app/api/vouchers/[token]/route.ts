import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getStoredTransactions, getStoredVouchers } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    if (!token) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // 1. Fetch primary transaction by token or id
      let tx = null;
      const { data: txByToken } = await supabase
        .from('transactions')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (txByToken) {
        tx = txByToken;
      } else {
        const { data: txById } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', token)
          .maybeSingle();
        if (txById) tx = txById;
      }

      if (!tx) {
        return NextResponse.json({ error: 'E-Voucher tidak ditemukan' }, { status: 404 });
      }

      // 2. Aggregate all transactions of the same customer if phone/name exists
      let allCustomerTxs = [tx];
      if (tx.customer_phone && tx.customer_phone.trim()) {
        const { data: phoneTxs } = await supabase
          .from('transactions')
          .select('*')
          .eq('customer_phone', tx.customer_phone.trim());
        if (phoneTxs && phoneTxs.length > 0) allCustomerTxs = phoneTxs;
      } else if (tx.customer_name && tx.customer_name.trim()) {
        const { data: nameTxs } = await supabase
          .from('transactions')
          .select('*')
          .eq('customer_name', tx.customer_name.trim());
        if (nameTxs && nameTxs.length > 0) allCustomerTxs = nameTxs;
      }

      const txIds = allCustomerTxs.map((t) => t.id);

      // 3. Fetch vouchers for all transactions of this customer
      const { data: vouchers, error: vError } = await supabase
        .from('vouchers')
        .select('*')
        .in('transaction_id', txIds)
        .order('code', { ascending: true });

      if (vError) {
        return NextResponse.json({ error: 'Gagal mengambil data voucher' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        transaction: tx,
        transactionsCount: allCustomerTxs.length,
        vouchers: vouchers || [],
      });
    } else {
      // Fallback local memory lookup
      const txs = getStoredTransactions();
      const tx = txs.find((t) => t.token === token || t.id === token);
      if (!tx) {
        return NextResponse.json({ error: 'E-Voucher tidak ditemukan' }, { status: 404 });
      }

      let allCustomerTxs = [tx];
      if (tx.customer_phone && tx.customer_phone.trim()) {
        const phoneTxs = txs.filter((t) => t.customer_phone === tx.customer_phone);
        if (phoneTxs.length > 0) allCustomerTxs = phoneTxs;
      } else if (tx.customer_name && tx.customer_name.trim()) {
        const nameTxs = txs.filter((t) => t.customer_name === tx.customer_name);
        if (nameTxs.length > 0) allCustomerTxs = nameTxs;
      }

      const txIds = new Set(allCustomerTxs.map((t) => t.id));
      const vouchers = getStoredVouchers().filter((v) => txIds.has(v.transaction_id));

      return NextResponse.json({
        success: true,
        transaction: tx,
        transactionsCount: allCustomerTxs.length,
        vouchers,
      });
    }
  } catch (err) {
    console.error('API /vouchers/[token] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
