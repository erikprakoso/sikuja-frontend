import { NextRequest, NextResponse } from 'next/server';
import { getVoucherData } from '@/lib/server/voucherData';

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

    const data = await getVoucherData(token);
    if (!data) {
      return NextResponse.json({ error: 'E-Voucher tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction: data.transaction,
      transactionsCount: data.transactionsCount,
      vouchers: data.vouchers,
    });
  } catch (err) {
    console.error('API /vouchers/[token] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
