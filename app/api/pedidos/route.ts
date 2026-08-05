import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClienteSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(30),
    email: z.string().trim().email().max(200),
  }),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(100),
  deliveryType: z.enum(["entrega", "retirada"]),
  deliveryAddress: z.string().trim().max(500).optional(),
  deliveryDate: z.string().date().optional(),
  deliveryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  observations: z.string().trim().max(1000).optional(),
}).superRefine((data, context) => {
  if (data.deliveryType === "entrega" && !data.deliveryAddress) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryAddress"], message: "Endereço obrigatório para entrega." });
  }
});

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados do pedido inválidos." }, { status: 400 });

  const input = parsed.data;
  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);

  const productIds = [...quantities.keys()];
  const { data: products, error: productsError } = await supabaseAdmin
    .from("produtos").select("id, nome, preco, ativo").in("id", productIds);
  if (productsError) return NextResponse.json({ error: "Não foi possível consultar os produtos." }, { status: 500 });
  if (!products || products.length !== productIds.length || products.some((product) => !product.ativo)) {
    return NextResponse.json({ error: "Um ou mais produtos estão indisponíveis." }, { status: 409 });
  }

  const orderItems = products.map((product) => ({
    produto_id: product.id,
    quantidade: quantities.get(product.id)!,
    preco_unitario: Number(product.preco),
  }));
  const subtotal = orderItems.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const session = await getClienteSession();
  let customerId = session.cliente?.id ?? null;
  if (!customerId) {
    const { data: existingCustomer } = await supabaseAdmin
      .from("clientes").select("id").eq("telefone", input.customer.phone).maybeSingle();
    customerId = existingCustomer?.id ?? null;
  }
  if (!customerId) {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("clientes")
      .insert({ nome: input.customer.name, telefone: input.customer.phone, email: input.customer.email })
      .select("id").single();
    if (customerError || !customer) return NextResponse.json({ error: "Não foi possível cadastrar o cliente." }, { status: 500 });
    customerId = customer.id;
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("pedidos")
    .insert({
      cliente_id: customerId,
      total,
      status: "aguardando_confirmacao",
      observacao: input.observations ?? "",
      tipo_entrega: input.deliveryType,
      taxa_entrega: deliveryFee,
      endereco_entrega: input.deliveryType === "entrega" ? input.deliveryAddress : null,
      data_entrega: input.deliveryDate ?? null,
      horario_entrega: input.deliveryTime ?? null,
    })
    .select("id").single();
  if (orderError || !order) return NextResponse.json({ error: "Não foi possível criar o pedido." }, { status: 500 });

  const { error: itemsError } = await supabaseAdmin.from("pedido_itens").insert(
    orderItems.map((item) => ({ ...item, pedido_id: order.id })),
  );
  if (itemsError) {
    await supabaseAdmin.from("pedidos").delete().eq("id", order.id);
    return NextResponse.json({ error: "Não foi possível salvar os itens do pedido." }, { status: 500 });
  }

  return NextResponse.json({ id: order.id, subtotal, deliveryFee, total }, { status: 201 });
}
