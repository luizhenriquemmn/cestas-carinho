import { NextResponse } from 'next/server';
import { getClienteSession } from '@/lib/session';

export async function POST() {
  const session = await getClienteSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
