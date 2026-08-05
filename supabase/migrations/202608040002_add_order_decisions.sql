alter table public.pedidos
  add column if not exists decisao_comentario text,
  add column if not exists decisao_em timestamptz,
  add column if not exists decisao_por_email text;

create table if not exists public.pedido_decisao_historico (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid,
  pedido_resumo jsonb not null,
  acao text not null check (acao in ('cancelar', 'rejeitar', 'excluir')),
  comentario text check (comentario is null or char_length(trim(comentario)) >= 1),
  admin_user_id uuid references auth.users(id),
  admin_email text not null,
  created_at timestamptz not null default now()
);

alter table public.pedido_decisao_historico enable row level security;

create or replace function public.excluir_pedido_admin(
  p_pedido_id uuid,
  p_comentario text,
  p_admin_user_id uuid,
  p_admin_email text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos%rowtype;
begin
  select * into v_pedido from pedidos where id = p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado'; end if;

  insert into pedido_decisao_historico (
    pedido_id, pedido_resumo, acao, comentario, admin_user_id, admin_email
  ) values (
    p_pedido_id, to_jsonb(v_pedido), 'excluir', nullif(trim(p_comentario), ''), p_admin_user_id, p_admin_email
  );

  delete from pedido_itens where pedido_id = p_pedido_id;
  delete from pedidos where id = p_pedido_id;
end;
$$;

revoke all on function public.excluir_pedido_admin(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.excluir_pedido_admin(uuid, text, uuid, text) to service_role;
