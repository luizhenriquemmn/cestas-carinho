import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const productSchema = z.object({
  nome: z.string().trim().min(2).max(150), descricao: z.string().trim().max(1000),
  preco: z.number().positive().max(1000000), categoria: z.string().trim().min(1).max(100),
  fotoUrl: z.string().trim().url().or(z.literal("")), ativo: z.boolean(),
  itens: z.array(z.string().trim().min(1).max(200)).max(100),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
  const input = parsed.data;
  const { data, error } = await supabaseAdmin.from("produtos").update({
    nome: input.nome, descricao: input.descricao, preco: input.preco, categoria: input.categoria,
    foto_url: input.fotoUrl, ativo: input.ativo, itens: input.itens,
  }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: "Não foi possível atualizar o produto." }, { status: 500 });
  return NextResponse.json(data);
}
