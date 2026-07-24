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
      // 1. Fetch transaction safely by token or id text string
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

      // 2. Fetch vouchers for this transaction
      const { data: vouchers, error: vError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('transaction_id', tx.id)
        .order('code', { ascending: true });

      if (vError) {
        return NextResponse.json({ error: 'Gagal mengambil data voucher' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        transaction: tx,
        vouchers: vouchers || [],
      });
    } else {
      // Fallback local memory lookup
      const txs = getStoredTransactions();
      const tx = txs.find((t) => t.token === token || t.id === token);
      if (!tx) {
        return NextResponse.json({ error: 'E-Voucher tidak ditemukan' }, { status: 404 });
      }

      const vouchers = getStoredVouchers().filter((v) => v.transaction_id === tx.id);
      return NextResponse.json({
        success: true,
        transaction: tx,
        vouchers,
      });
    }
  } catch (err) {
    console.error('API /vouchers/[token] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
