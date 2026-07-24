import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createPurchaseTransaction, format5DigitCode } from '@/lib/services/voucher';
import { generate5DigitCode, generateTransactionToken } from '@/lib/services/voucher';
import { Transaction, Voucher } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const qtyFisik = Number(body.qtyFisik) || 0;
    const qtyNonFisik = Number(body.qtyNonFisik) || 0;
    const customCodes: string[] = Array.isArray(body.customCodes) ? body.customCodes : [];

    const totalLembar = qtyFisik + qtyNonFisik;

    if (totalLembar <= 0) {
      return NextResponse.json({ error: 'Kuantitas voucher harus lebih besar dari 0' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // Fetch all existing voucher codes from Supabase to prevent duplicates
      const { data: existingCodesData } = await supabase.from('vouchers').select('code');
      const usedCodes = new Set((existingCodesData || []).map((v) => v.code));

      // Validate custom codes
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

      const txId = 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const token = generateTransactionToken();

      // Allocate custom codes first, then fill remaining with random codes
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

      // Assign first qtyFisik as 'fisik'
      for (let i = 0; i < qtyFisik; i++) {
        newVouchers.push({
          code: finalCodes[i],
          type: 'fisik',
          status: 'terbit',
          transaction_id: txId,
          created_at: new Date().toISOString(),
        });
      }

      // Assign remaining as 'non-fisik'
      for (let i = qtyFisik; i < totalLembar; i++) {
        newVouchers.push({
          code: finalCodes[i],
          type: 'non-fisik',
          status: 'terbit',
          transaction_id: txId,
          created_at: new Date().toISOString(),
        });
      }

      const transaction: Transaction = {
        id: txId,
        token,
        qty_fisik: qtyFisik,
        qty_non_fisik: qtyNonFisik,
        total_harga: totalLembar * 5000,
        created_at: new Date().toISOString(),
      };

      // Save transaction & vouchers to Supabase
      const { error: txErr } = await supabase.from('transactions').insert([transaction]);
      if (txErr) throw txErr;

      const { error: vErr } = await supabase.from('vouchers').insert(newVouchers);
      if (vErr) throw vErr;

      return NextResponse.json({
        success: true,
        transaction,
        vouchers: newVouchers,
      });
    } else {
      // Local storage fallback
      const result = createPurchaseTransaction(qtyFisik, qtyNonFisik, customCodes);
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
