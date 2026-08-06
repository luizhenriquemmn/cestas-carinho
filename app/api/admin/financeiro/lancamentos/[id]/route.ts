import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const updateSchema = z.object({
  status: z.enum(["pendente", "pago", "cancelado"]),
  dataPagamento: z.string().date().nullable().optional(),
}).superRefine((data, context) => {
  if (data.status === "pago" && !data.dataPagamento) context.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a data do pagamento.", path: ["dataPagamento"] });
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Lançamento inválido." }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("financeiro_lancamentos").update({
    status: parsed.data.status,
    data_pagamento: parsed.data.status === "pago" ? parsed.data.dataPagamento : null,
  }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: "Não foi possível atualizar o lançamento." }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Lançamento inválido." }, { status: 400 });
  const { error } = await supabaseAdmin.from("financeiro_lancamentos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível excluir o lançamento." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
