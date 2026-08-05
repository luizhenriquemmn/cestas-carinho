import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const updateSchema = z.object({
  status: z.enum(["aguardando_confirmacao", "confirmado", "em_preparo", "saiu_para_entrega", "entregue", "cancelado", "rejeitado"]),
  deliveryFee: z.number().min(0).max(100000),
  discountType: z.enum(["valor", "percentual"]).nullable(),
  discountInput: z.number().min(0).max(100000),
  discountReason: z.string().trim().max(500),
  decisionAction: z.enum(["cancelar", "rejeitar"]).optional(),
  decisionComment: z.string().trim().max(1000).optional(),
}).superRefine((data, context) => {
  if (data.discountType === "percentual" && data.discountInput > 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["discountInput"], message: "Percentual máximo de 100%." });
  }
});

async function getAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: { user } } = await authClient.auth.getUser(token);
  if (!user?.email) return null;
  const { data: admin } = await supabaseAdmin
    .from("admin_users").select("ativo").eq("email", user.email).maybeSingle();
  return admin?.ativo ? user : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("pedido_itens").select("quantidade, preco_unitario").eq("pedido_id", id);
  if (itemsError) return NextResponse.json({ error: "Não foi possível consultar os itens." }, { status: 500 });
  if (!items?.length) return NextResponse.json({ error: "Pedido sem itens não pode ser recalculado." }, { status: 409 });

  const { data: currentOrder } = await supabaseAdmin
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const input = parsed.data;
  const subtotal = items.reduce((sum, item) => sum + Number(item.preco_unitario) * item.quantidade, 0);
  let discountValue = input.discountType === "percentual"
    ? subtotal * input.discountInput / 100
    : input.discountType === "valor" ? input.discountInput : 0;
  discountValue = Math.min(Math.round(discountValue * 100) / 100, subtotal);
  const total = Math.round((subtotal - discountValue + input.deliveryFee) * 100) / 100;

  const decisionPayload = input.decisionAction ? {
    decisao_comentario: input.decisionComment || null,
    decisao_em: new Date().toISOString(),
    decisao_por_email: admin.email,
  } : {};
  const { error: updateError } = await supabaseAdmin.from("pedidos").update({
    status: input.status,
    subtotal,
    taxa_entrega: input.deliveryFee,
    desconto_tipo: input.discountType,
    desconto_informado: input.discountType ? input.discountInput : 0,
    desconto_valor: discountValue,
    desconto_motivo: discountValue > 0 ? input.discountReason : null,
    total,
    ...decisionPayload,
  }).eq("id", id);
  if (updateError) return NextResponse.json({ error: input.decisionAction ? "Não foi possível registrar a decisão. Verifique se a migration de decisões foi aplicada." : "Não foi possível atualizar o pedido." }, { status: 500 });

  if (input.decisionAction) {
    const { error: decisionError } = await supabaseAdmin.from("pedido_decisao_historico").insert({
      pedido_id: id,
      pedido_resumo: currentOrder,
      acao: input.decisionAction,
      comentario: input.decisionComment || null,
      admin_user_id: admin.id,
      admin_email: admin.email,
    });
    if (decisionError) return NextResponse.json({ error: "Pedido atualizado, mas o histórico da decisão não pôde ser registrado." }, { status: 500 });
  }

  const discountChanged =
    currentOrder?.desconto_tipo !== input.discountType ||
    Number(currentOrder?.desconto_informado ?? 0) !== input.discountInput ||
    Number(currentOrder?.desconto_valor ?? 0) !== discountValue ||
    (currentOrder?.desconto_motivo ?? "") !== (discountValue > 0 ? input.discountReason : "");

  if (discountValue > 0 && discountChanged) {
    const { error: historyError } = await supabaseAdmin.from("pedido_desconto_historico").insert({
      pedido_id: id,
      desconto_tipo: input.discountType,
      desconto_informado: input.discountInput,
      desconto_valor: discountValue,
      motivo: input.discountReason,
      admin_user_id: admin.id,
      admin_email: admin.email,
    });
    if (historyError) return NextResponse.json({ error: "Pedido atualizado, mas o histórico do desconto não pôde ser registrado." }, { status: 500 });
  }

  return NextResponse.json({ subtotal, discountValue, deliveryFee: input.deliveryFee, total });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ comment: z.string().trim().max(1000).optional().default("") }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const { error } = await supabaseAdmin.rpc("excluir_pedido_admin", {
    p_pedido_id: id,
    p_comentario: parsed.data.comment,
    p_admin_user_id: admin.id,
    p_admin_email: admin.email!,
  });
  if (error) return NextResponse.json({ error: "Não foi possível excluir o pedido. Verifique se a migration de decisões foi aplicada." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
