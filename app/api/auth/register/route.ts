import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getClienteSession } from "@/lib/session";

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(8).max(30),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  senha: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Verifique os dados informados e use uma senha de pelo menos 8 caracteres." }, { status: 400 });
  const { nome, telefone, email, senha } = parsed.data;

  const { data: existing } = await supabaseAdmin.from("clientes").select("id").eq("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, tipo: "cliente" },
  });
  if (authError || !authData.user) {
    const duplicate = authError?.message.toLowerCase().includes("already") || authError?.status === 422;
    return NextResponse.json({ error: duplicate ? "E-mail já cadastrado." : "Não foi possível criar a conta." }, { status: duplicate ? 409 : 500 });
  }

  const { data: cliente, error: customerError } = await supabaseAdmin
    .from("clientes").insert({ nome, telefone, email, user_id: authData.user.id, senha_hash: null })
    .select("id, nome, email").single();
  if (customerError || !cliente) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: "Não foi possível criar a conta." }, { status: 500 });
  }

  const session = await getClienteSession();
  session.cliente = { id: cliente.id, nome: cliente.nome, email: cliente.email };
  await session.save();
  return NextResponse.json({ ok: true });
}
