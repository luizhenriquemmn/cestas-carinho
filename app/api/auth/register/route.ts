import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getClienteSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { nome, telefone, email, senha } = await req.json();

  if (!nome || !telefone || !email || !senha) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }

  // Verificar se e-mail já existe
  const { data: existing } = await supabaseAdmin
    .from('clientes')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
  }

  const senha_hash = await bcrypt.hash(senha, 12);

  const { data: cliente, error } = await supabaseAdmin
    .from('clientes')
    .insert({ nome, telefone, email, senha_hash })
    .select('id, nome, email')
    .single();

  if (error || !cliente) {
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 });
  }

  const session = await getClienteSession();
  session.cliente = { id: cliente.id, nome: cliente.nome, email: cliente.email };
  await session.save();

  return NextResponse.json({ ok: true });
}
