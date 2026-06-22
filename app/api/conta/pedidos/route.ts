import { NextResponse } from 'next/server';
import { getClienteSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const session = await getClienteSession();
  if (!session.cliente) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .select('*, clientes(nome, telefone, email), pedido_itens(*, produtos(nome, preco))')
    .eq('cliente_id', session.cliente.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
