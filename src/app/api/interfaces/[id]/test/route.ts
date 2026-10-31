import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Interface testing is not configured for the connected backend.' },
    { status: 501 }
  );
}
