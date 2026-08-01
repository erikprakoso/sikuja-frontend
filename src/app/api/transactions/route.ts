import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { serverSupabase, isServerSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase-server';
import { createPurchaseTransaction, format5DigitCode } from '@/lib/services/voucher';
import { generate5DigitCode, generateTransactionToken } from '@/lib/services/voucher';
import { Transaction, Voucher } from '@/types';
import { requireAuth } from '@/lib/server-auth';

const MAX_VOUCHERS_PER_SALE = 200;
const MAX_CODE_GEN_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['penjual', 'admin']);
    if (auth instanceof NextResponse) return auth;

    if (isServerSupabaseConfigured() && !isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi: tambahkan SUPABASE_SERVICE_ROLE_KEY di environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const qtyFisik = Number(body.qtyFisik) || 0;
    const qtyNonFisik = Number(body.qtyNonFisik) || 0;
    const customCodes: string[] = Array.isArray(body.customCodes) ? body.customCodes : [];
    const customerName = (body.customerName || '').toString();
    const customerPhone = (body.customerPhone || '').toString();
    const paymentMethod: 'cash' | 'qris' = body.paymentMethod === 'qris' ? 'qris' : 'cash';

    const totalLembar = qtyFisik + qtyNonFisik;

    if (totalLembar <= 0) {
      return NextResponse.json({ error: 'Kuantitas voucher harus lebih besar dari 0' }, { status: 400 });
    }

    if (totalLembar > MAX_VOUCHERS_PER_SALE) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_VOUCHERS_PER_SALE} voucher per transaksi.` },
        { status: 400 }
      );
    }

    if (isServerSupabaseConfigured()) {
      const txId = 'tx_' + randomUUID();
      const token = generateTransactionToken();

      const transaction: Transaction = {
        id: txId,
        token,
        qty_fisik: qtyFisik,
        qty_non_fisik: qtyNonFisik,
        total_harga: totalLembar * 5000,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        ...(auth.userId ? { created_by: auth.userId } : {}),
      };

      // Simpan transaksi dulu, lalu alokasikan voucher.
      const { error: txErr } = await serverSupabase.from('transactions').insert([transaction]);
      if (txErr) throw txErr;

      // Multi-kasir: kode 5-digit unik dijamin PRIMARY KEY di tabel vouchers.
      // Jika dua kasir transaksi bersamaan dan kode tabrakan, DB menolak (23505)
      // dan kita alokasikan ulang dengan kode baru.
      let insertedVouchers: Voucher[] | null = null;

      for (let attempt = 0; attempt < MAX_CODE_GEN_ATTEMPTS && !insertedVouchers; attempt++) {
        const { data: existingCodesData } = await serverSupabase.from('vouchers').select('code');
        const usedCodes = new Set((existingCodesData || []).map((v) => v.code));

        // Validasi custom codes terhadap snapshot terbaru DB
        const validatedCustomCodes: string[] = [];
        for (const rawCode of customCodes) {
          if (!rawCode || !rawCode.trim()) continue;
          const formatted = format5DigitCode(rawCode);
          if (!formatted) continue;
          if (usedCodes.has(formatted)) {
            return NextResponse.json(
              { error: `Kode voucher ${formatted} sudah terbit / dimiliki peserta lain.` },
              { status: 400 }
            );
          }
          validatedCustomCodes.push(formatted);
        }

        // Alokasikan custom codes dulu, sisanya kode acak
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

        // qtyFisik pertama sebagai 'fisik', sisanya 'non-fisik'
        for (let i = 0; i < qtyFisik; i++) {
          newVouchers.push({
            code: finalCodes[i],
            type: 'fisik',
            status: 'terbit',
            transaction_id: txId,
            created_at: new Date().toISOString(),
          });
        }

        for (let i = qtyFisik; i < totalLembar; i++) {
          newVouchers.push({
            code: finalCodes[i],
            type: 'non-fisik',
            status: 'terbit',
            transaction_id: txId,
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
        // Bersihkan transaksi yatim (tanpa voucher) lalu laporkan error.
        await serverSupabase.from('transactions').delete().eq('id', txId);
        return NextResponse.json(
          { error: 'Gagal mengalokasikan kode unik karena tabrakan. Silakan coba lagi.' },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        transaction,
        vouchers: insertedVouchers,
      });
    } else {
      // Local storage fallback (mode dev tanpa Supabase)
      const result = createPurchaseTransaction(
        qtyFisik,
        qtyNonFisik,
        customCodes,
        customerName,
        customerPhone,
        paymentMethod
      );
      return NextResponse.json({
        success: true,
        ...result,
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /transactions error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
