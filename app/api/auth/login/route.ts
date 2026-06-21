import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getClienteSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return NextResponse.json({ error: 'E-mail e senha obrigatórios.' }, { status: 400 });
  }

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('id, nome, email, senha_hash')
    .eq('email', email)
    .maybeSingle();

  if (!cliente || !cliente.senha_hash) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }

  const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash);
  if (!senhaCorreta) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }

  const session = await getClienteSession();
  session.cliente = { id: cliente.id, nome: cliente.nome, email: cliente.email };
  await session.save();

  return NextResponse.json({ ok: true });
}
