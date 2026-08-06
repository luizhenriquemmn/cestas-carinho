alter table public.pedido_itens
  add column if not exists produto_snapshot jsonb not null default '{}'::jsonb;

update public.pedido_itens item
set produto_snapshot = jsonb_build_object(
  'id', produto.id,
  'nome', produto.nome,
  'descricao', produto.descricao,
  'preco', item.preco_unitario,
  'foto_url', produto.foto_url,
  'categoria', produto.categoria,
  'itens', coalesce(to_jsonb(produto.itens), '[]'::jsonb)
)
from public.produtos produto
where produto.id = item.produto_id
  and item.produto_snapshot = '{}'::jsonb;

comment on column public.pedido_itens.produto_snapshot is
  'Fotografia imutável do produto no momento da compra para preservar o histórico comercial.';
