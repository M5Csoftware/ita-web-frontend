import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const status = searchParams.get('status') || '';
  const interfaceId = searchParams.get('interfaceId') || '';

  let list = getTransactions();

  if (q) {
    list = list.filter(
      (tx) =>
        tx.id.toLowerCase().includes(q) ||
        tx.interfaceName.toLowerCase().includes(q) ||
        (tx.errorMessage && tx.errorMessage.toLowerCase().includes(q))
    );
  }

  if (status && status !== 'ALL') {
    list = list.filter((tx) => tx.status === status);
  }

  if (interfaceId) {
    list = list.filter((tx) => tx.interfaceId === interfaceId);
  }

  return NextResponse.json({ transactions: list, count: list.length });
}

