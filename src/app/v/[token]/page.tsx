import { getVoucherData } from '@/lib/server/voucherData';
import ParticipantEVoucherClient from './ParticipantEVoucherClient';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ParticipantEVoucherPage({ params }: Props) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  const data = await getVoucherData(token);
  return <ParticipantEVoucherClient token={token} initialData={data} />;
}
