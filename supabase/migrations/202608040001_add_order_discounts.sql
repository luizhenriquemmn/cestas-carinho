-- Desconto auditável por pedido. Execute no Supabase antes de habilitar a UI de descontos.
alter table public.pedidos
  add column if not exists subtotal numeric(12,2),
  add column if not exists desconto_tipo text,
  add column if not exists desconto_informado numeric(12,2) not null default 0,
  add column if not exists desconto_valor numeric(12,2) not null default 0,
  add column if not exists desconto_motivo text;

update public.pedidos
set subtotal = greatest(total - coalesce(taxa_entrega, 0), 0)
where subtotal is null;

create or replace function public.preencher_subtotal_pedido()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.subtotal is null then
    new.subtotal := greatest(
      new.total - coalesce(new.taxa_entrega, 0) + coalesce(new.desconto_valor, 0),
      0
    );
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_preencher_subtotal on public.pedidos;
create trigger pedidos_preencher_subtotal
before insert or update on public.pedidos
for each row execute function public.preencher_subtotal_pedido();

alter table public.pedidos
  alter column subtotal set not null,
  add constraint pedidos_desconto_tipo_check
    check (desconto_tipo is null or desconto_tipo in ('valor', 'percentual')),
  add constraint pedidos_desconto_informado_check
    check (desconto_informado >= 0),
  add constraint pedidos_desconto_valor_check
    check (desconto_valor >= 0 and desconto_valor <= subtotal),
  add constraint pedidos_total_check
    check (total >= 0);

create table if not exists public.pedido_desconto_historico (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  desconto_tipo text check (desconto_tipo in ('valor', 'percentual')),
  desconto_informado numeric(12,2) not null default 0 check (desconto_informado >= 0),
  desconto_valor numeric(12,2) not null default 0 check (desconto_valor >= 0),
  motivo text not null,
  admin_user_id uuid references auth.users(id),
  admin_email text,
  created_at timestamptz not null default now()
);

alter table public.pedido_desconto_historico enable row level security;

comment on table public.pedido_desconto_historico is
  'Registro imutável das concessões e alterações de desconto em pedidos.';
