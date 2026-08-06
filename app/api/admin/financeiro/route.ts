import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const accountSchema = z.object({
  resource: z.literal("conta"),
  nome: z.string().trim().min(2).max(100),
  tipo: z.enum(["caixa", "banco", "pix", "cartao", "outro"]),
  saldoInicial: z.number().min(-100000000).max(100000000),
});

const categorySchema = z.object({
  resource: z.literal("categoria"),
  nome: z.string().trim().min(2).max(100),
  tipo: z.enum(["receita", "despesa"]),
});

const entryFields = z.object({
  tipo: z.enum(["receita", "despesa"]),
  descricao: z.string().trim().min(2).max(300),
  categoriaId: z.string().uuid(),
  contaId: z.string().uuid(),
  pedidoId: z.string().uuid().nullable().optional(),
  valor: z.number().positive().max(100000000),
  status: z.enum(["pendente", "pago", "cancelado"]),
  dataCompetencia: z.string().date(),
  dataVencimento: z.string().date().nullable().optional(),
  dataPagamento: z.string().date().nullable().optional(),
  formaPagamento: z.enum(["dinheiro", "pix", "debito", "credito", "boleto", "transferencia", "outro"]).nullable().optional(),
  documento: z.string().trim().max(200).nullable().optional(),
  observacao: z.string().trim().max(1000).nullable().optional(),
});

const entrySchema = entryFields.extend({ resource: z.literal("lancamento") }).superRefine((data, context) => {
  if (data.status === "pago" && !data.dataPagamento) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["dataPagamento"], message: "Informe a data do pagamento." });
  }
});

const createSchema = z.union([accountSchema, categorySchema, entrySchema]);

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  let entriesQuery = supabaseAdmin
    .from("financeiro_lancamentos")
    .select("*, financeiro_categorias(nome), financeiro_contas(nome)")
    .order("data_competencia", { ascending: false });
  if (from) entriesQuery = entriesQuery.gte("data_competencia", from);
  if (to) entriesQuery = entriesQuery.lte("data_competencia", to);

  const [accountsResult, categoriesResult, entriesResult] = await Promise.all([
    supabaseAdmin.from("financeiro_contas").select("*").eq("ativo", true).order("nome"),
    supabaseAdmin.from("financeiro_categorias").select("*").eq("ativo", true).order("tipo").order("nome"),
    entriesQuery,
  ]);
  const error = accountsResult.error ?? categoriesResult.error ?? entriesResult.error;
  if (error) return NextResponse.json({ error: "Módulo financeiro ainda não foi criado no Supabase." }, { status: 500 });

  const allPaidResult = await supabaseAdmin
    .from("financeiro_lancamentos").select("conta_id, tipo, valor").eq("status", "pago");
  const paidAll = allPaidResult.data ?? [];
  const accounts = (accountsResult.data ?? []).map((account) => {
    const movement = paidAll.filter((entry) => entry.conta_id === account.id)
      .reduce((sum, entry) => sum + (entry.tipo === "receita" ? Number(entry.valor) : -Number(entry.valor)), 0);
    return { ...account, saldo_atual: Number(account.saldo_inicial) + movement };
  });
  const entries = entriesResult.data ?? [];
  const paid = entries.filter((entry) => entry.status === "pago");
  const summary = {
    receitas: paid.filter((entry) => entry.tipo === "receita").reduce((sum, entry) => sum + Number(entry.valor), 0),
    despesas: paid.filter((entry) => entry.tipo === "despesa").reduce((sum, entry) => sum + Number(entry.valor), 0),
    aReceber: entries.filter((entry) => entry.tipo === "receita" && entry.status === "pendente").reduce((sum, entry) => sum + Number(entry.valor), 0),
    aPagar: entries.filter((entry) => entry.tipo === "despesa" && entry.status === "pendente").reduce((sum, entry) => sum + Number(entry.valor), 0),
    saldoContas: accounts.reduce((sum, account) => sum + account.saldo_atual, 0),
  };
  return NextResponse.json({ accounts, categories: categoriesResult.data ?? [], entries, summary });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const input = parsed.data;

  if (input.resource === "conta") {
    const { data, error } = await supabaseAdmin.from("financeiro_contas")
      .insert({ nome: input.nome, tipo: input.tipo, saldo_inicial: input.saldoInicial }).select("*").single();
    if (error) return NextResponse.json({ error: "Não foi possível criar a conta. Verifique se o nome já existe." }, { status: 409 });
    return NextResponse.json(data, { status: 201 });
  }
  if (input.resource === "categoria") {
    const { data, error } = await supabaseAdmin.from("financeiro_categorias")
      .insert({ nome: input.nome, tipo: input.tipo }).select("*").single();
    if (error) return NextResponse.json({ error: "Não foi possível criar a categoria." }, { status: 409 });
    return NextResponse.json(data, { status: 201 });
  }

  const { data, error } = await supabaseAdmin.from("financeiro_lancamentos").insert({
    tipo: input.tipo,
    descricao: input.descricao,
    categoria_id: input.categoriaId,
    conta_id: input.contaId,
    pedido_id: input.pedidoId ?? null,
    valor: input.valor,
    status: input.status,
    data_competencia: input.dataCompetencia,
    data_vencimento: input.dataVencimento ?? null,
    data_pagamento: input.status === "pago" ? input.dataPagamento : null,
    forma_pagamento: input.formaPagamento ?? null,
    documento: input.documento ?? null,
    observacao: input.observacao ?? null,
    criado_por_id: admin.id,
    criado_por_email: admin.email,
  }).select("*").single();
  if (error) return NextResponse.json({ error: "Não foi possível criar o lançamento." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
