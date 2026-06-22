import { NextResponse } from 'next/server';
import { getClienteSession } from '@/lib/session';

export async function GET() {
  const session = await getClienteSession();
  if (!session.cliente) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  return NextResponse.json(session.cliente);
}
