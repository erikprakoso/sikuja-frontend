import { serverSupabase, isServerSupabaseConfigured } from '@/lib/supabase-server';
import type { Transaction, Voucher } from '@/types';

export interface VoucherData {
  transaction: Transaction;
  transactionsCount: number;
  vouchers: Voucher[];
}

/**
 * Mengambil data E-Voucher seorang peserta langsung dari database (server-side).
 * Dipakai oleh halaman `/v/[token]` (server component) dan API route `[token]`.
 *
 * Mengembalikan `null` jika Supabase belum dikonfigurasi atau transaksi tidak
 * ditemukan / gagal diambil — penelepon memutuskan sendiri responsnya.
 */
export async function getVoucherData(token: string): Promise<VoucherData | null> {
  if (!token) return null;
  if (!isServerSupabaseConfigured()) return null;

  // 1. Fetch primary transaction by token or id
  let tx: Transaction | null = null;
  const { data: txByToken } = await serverSupabase
    .from('transactions')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (txByToken) {
    tx = txByToken as Transaction;
  } else {
    const { data: txById } = await serverSupabase
      .from('transactions')
      .select('*')
      .eq('id', token)
      .maybeSingle();
    if (txById) tx = txById as Transaction;
  }

  if (!tx) return null;

  // 2. Aggregate all transactions of the same customer if phone/name exists
  let allCustomerTxs: Transaction[] = [tx];
  if (tx.customer_phone && tx.customer_phone.trim()) {
    const { data: phoneTxs } = await serverSupabase
      .from('transactions')
      .select('*')
      .eq('customer_phone', tx.customer_phone.trim());
    if (phoneTxs && phoneTxs.length > 0) allCustomerTxs = phoneTxs as Transaction[];
  } else if (tx.customer_name && tx.customer_name.trim()) {
    const { data: nameTxs } = await serverSupabase
      .from('transactions')
      .select('*')
      .eq('customer_name', tx.customer_name.trim());
    if (nameTxs && nameTxs.length > 0) allCustomerTxs = nameTxs as Transaction[];
  }

  const txIds = allCustomerTxs.map((t) => t.id);

  // 3. Fetch vouchers for all transactions of this customer
  const { data: vouchers, error: vError } = await serverSupabase
    .from('vouchers')
    .select('*')
    .in('transaction_id', txIds)
    .order('code', { ascending: true });

  if (vError) {
    console.error('getVoucherData error:', vError);
    return null;
  }

  return {
    transaction: tx,
    transactionsCount: allCustomerTxs.length,
    vouchers: (vouchers as Voucher[]) || [],
  };
}
