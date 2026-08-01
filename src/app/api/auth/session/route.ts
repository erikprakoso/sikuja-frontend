import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  return NextResponse.json({ session });
}
