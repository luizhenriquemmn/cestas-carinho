import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getClienteSession } from "@/lib/session";

const schema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  // Contas antigas aceitavam 6 caracteres; após a migração, novas senhas exigem 8.
  senha: z.string().min(6).max(200),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  const { email, senha } = parsed.data;

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: authData } = await authClient.auth.signInWithPassword({ email, password: senha });

  let cliente = null;
  if (authData.user) {
    const { data } = await supabaseAdmin
      .from("clientes").select("id, nome, email, user_id").or(`user_id.eq.${authData.user.id},email.eq.${email}`).maybeSingle();
    cliente = data;
    if (cliente && cliente.user_id !== authData.user.id) {
      await supabaseAdmin.from("clientes").update({ user_id: authData.user.id, senha_hash: null }).eq("id", cliente.id);
    }
  } else {
    // Compatibilidade: migra automaticamente uma conta antiga no primeiro login válido.
    const { data: legacyCustomer } = await supabaseAdmin
      .from("clientes").select("id, nome, email, senha_hash, user_id").eq("email", email).maybeSingle();
    if (legacyCustomer?.senha_hash && await bcrypt.compare(senha, legacyCustomer.senha_hash)) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome: legacyCustomer.nome, tipo: "cliente" },
      });
      if (!createError && created.user) {
        await supabaseAdmin.from("clientes").update({ user_id: created.user.id, senha_hash: null }).eq("id", legacyCustomer.id);
        cliente = legacyCustomer;
      }
    }
  }

  if (!cliente) return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  const session = await getClienteSession();
  session.cliente = { id: cliente.id, nome: cliente.nome, email: cliente.email };
  await session.save();
  return NextResponse.json({ ok: true });
}
