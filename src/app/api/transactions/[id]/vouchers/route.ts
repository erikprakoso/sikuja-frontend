import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { appendVouchersToTransaction, format5DigitCode, generate5DigitCode } from '@/lib/services/voucher';
import { Transaction, Voucher } from '@/types';
import { requireAuth } from '@/lib/server-auth';

const MAX_VOUCHERS_PER_SALE = 200;
const MAX_CODE_GEN_ATTEMPTS = 5;

/**
 * POST /api/transactions/[id]/vouchers
 * Menambahkan (append) voucher baru ke transaksi yang SUDAH ADA.
 * Dipakai alur nama kembar: kasir memilih "Isi Otomatis" dari riwayat, lalu kupon
 * baru digabung ke transaksi tersebut — token & ID tetap, qty & total_harga dijumlah.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request, ['penjual', 'admin']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const body = await request.json();
    const qtyFisik = Number(body.qtyFisik) || 0;
    const qtyNonFisik = Number(body.qtyNonFisik) || 0;
    const customCodes: string[] = Array.isArray(body.customCodes) ? body.customCodes : [];
    const customerPhone = (body.customerPhone || '').toString();
    const paymentMethod: 'cash' | 'qris' | 'free' =
      body.paymentMethod === 'qris' ? 'qris' : body.paymentMethod === 'free' ? 'free' : 'cash';

    const totalLembar = qtyFisik + qtyNonFisik;

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi tidak valid.' }, { status: 400 });
    }

    if (totalLembar <= 0) {
      return NextResponse.json({ error: 'Kuantitas voucher harus lebih besar dari 0' }, { status: 400 });
    }

    if (totalLembar > MAX_VOUCHERS_PER_SALE) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_VOUCHERS_PER_SALE} voucher per transaksi.` },
        { status: 400 }
      );
    }

    if (!isServerSupabaseConfigured()) {
      // Local storage fallback (mode dev tanpa Supabase).
      const result = appendVouchersToTransaction(
        id,
        qtyFisik,
        qtyNonFisik,
        customCodes,
        customerPhone,
        paymentMethod
      );
      return NextResponse.json({ success: true, ...result });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    // Ambil transaksi tujuan (harus ada).
    const { data: existing, error: fetchErr } = await serverSupabase
      .from('transactions')
      .select('id, token, qty_fisik, qty_non_fisik, total_harga, customer_name, customer_phone, payment_method, created_by, created_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!existing) {
      return NextResponse.json({ error: 'Transaksi tujuan tidak ditemukan.' }, { status: 404 });
    }

    // Multi-kasir: kode 5-digit unik dijamin PRIMARY KEY di tabel vouchers.
    let insertedVouchers: Voucher[] | null = null;

    for (let attempt = 0; attempt < MAX_CODE_GEN_ATTEMPTS && !insertedVouchers; attempt++) {
      const { data: existingCodesData } = await serverSupabase.from('vouchers').select('code');
      const usedCodes = new Set((existingCodesData || []).map((v) => v.code));

      const validatedCustomCodes: string[] = [];
      for (const rawCode of customCodes) {
        if (!rawCode || !rawCode.trim()) continue;
        const formatted = format5DigitCode(rawCode);
        if (!formatted) continue;
        if (usedCodes.has(formatted)) {
          return NextResponse.json(
            { error: `Kode voucher ${formatted} sudah terbit / dimiliki peserta lain.`, conflictCode: formatted },
            { status: 400 }
          );
        }
        validatedCustomCodes.push(formatted);
      }

      const finalCodes: string[] = [];
      let customIdx = 0;

      for (let i = 0; i < totalLembar; i++) {
        if (customIdx < validatedCustomCodes.length) {
          const code = validatedCustomCodes[customIdx++];
          usedCodes.add(code);
          finalCodes.push(code);
        } else {
          const code = generate5DigitCode(usedCodes);
          usedCodes.add(code);
          finalCodes.push(code);
        }
      }

      const newVouchers: Voucher[] = [];

      for (let i = 0; i < qtyFisik; i++) {
        newVouchers.push({
          code: finalCodes[i],
          type: 'fisik',
          status: 'terbit',
          transaction_id: id,
          created_at: new Date().toISOString(),
        });
      }

      for (let i = qtyFisik; i < totalLembar; i++) {
        newVouchers.push({
          code: finalCodes[i],
          type: 'non-fisik',
          status: 'terbit',
          transaction_id: id,
          created_at: new Date().toISOString(),
        });
      }

      const { error: vErr } = await serverSupabase.from('vouchers').insert(newVouchers);
      if (!vErr) {
        insertedVouchers = newVouchers;
      } else if (vErr.code !== '23505') {
        throw vErr;
      }
      // 23505 (duplicate key): tabrakan dengan kasir lain → coba alokasi ulang.
    }

    if (!insertedVouchers) {
      return NextResponse.json(
        { error: 'Gagal mengalokasikan kode unik karena tabrakan. Silakan coba lagi.' },
        { status: 409 }
      );
    }

    const updatedTx: Transaction = {
      ...(existing as Transaction),
      qty_fisik: (existing.qty_fisik || 0) + qtyFisik,
      qty_non_fisik: (existing.qty_non_fisik || 0) + qtyNonFisik,
      total_harga: (existing.total_harga || 0) + (paymentMethod === 'free' ? 0 : totalLembar * 5000),
      payment_method: paymentMethod,
      ...(customerPhone.trim() ? { customer_phone: customerPhone.trim() } : {}),
    };

    const { error: updateErr } = await serverSupabase
      .from('transactions')
      .update({
        qty_fisik: updatedTx.qty_fisik,
        qty_non_fisik: updatedTx.qty_non_fisik,
        total_harga: updatedTx.total_harga,
        payment_method: updatedTx.payment_method,
        ...(updatedTx.customer_phone ? { customer_phone: updatedTx.customer_phone } : {}),
      })
      .eq('id', id);

    if (updateErr) throw updateErr;

    // Kembalikan SELURUH voucher milik transaksi (lama + baru) agar hasil akhir
    // konsisten dengan qty kumulatif yang ditampilkan di TransactionResult / struk.
    const { data: allVouchers, error: allErr } = await serverSupabase
      .from('vouchers')
      .select('*')
      .eq('transaction_id', id)
      .order('code', { ascending: true });

    if (allErr) throw allErr;

    return NextResponse.json({
      success: true,
      transaction: updatedTx,
      vouchers: (allVouchers as Voucher[]) || [],
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /transactions/[id]/vouchers error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
