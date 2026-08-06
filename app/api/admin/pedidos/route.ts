import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("*, clientes(nome, telefone, email), pedido_itens(*, produtos(nome, preco, descricao, foto_url, categoria, itens))")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
  return NextResponse.json(data ?? []);
}
