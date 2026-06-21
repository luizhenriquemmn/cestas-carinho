import { NextRequest, NextResponse } from 'next/server';
import { getClienteSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const session = await getClienteSession();
  if (!session.cliente) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('clientes')
    .select('nome, telefone, email')
    .eq('id', session.cliente.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await getClienteSession();
  if (!session.cliente) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await req.json();
  const { nome, telefone, email } = body as { nome: string; telefone: string; email: string };

  const { error } = await supabaseAdmin
    .from('clientes')
    .update({ nome, telefone, email })
    .eq('id', session.cliente.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
