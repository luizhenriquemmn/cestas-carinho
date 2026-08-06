create table if not exists public.financeiro_contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  tipo text not null check (tipo in ('caixa', 'banco', 'pix', 'cartao', 'outro')),
  saldo_inicial numeric(14,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financeiro_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (nome, tipo)
);

create table if not exists public.financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita', 'despesa')),
  descricao text not null,
  categoria_id uuid not null references public.financeiro_categorias(id),
  conta_id uuid not null references public.financeiro_contas(id),
  pedido_id uuid references public.pedidos(id) on delete set null,
  valor numeric(14,2) not null check (valor > 0),
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  data_competencia date not null,
  data_vencimento date,
  data_pagamento date,
  forma_pagamento text check (forma_pagamento is null or forma_pagamento in ('dinheiro', 'pix', 'debito', 'credito', 'boleto', 'transferencia', 'outro')),
  documento text,
  observacao text,
  criado_por_id uuid references auth.users(id),
  criado_por_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'pago' or data_pagamento is not null)
);

create index if not exists financeiro_lancamentos_competencia_idx on public.financeiro_lancamentos(data_competencia);
create index if not exists financeiro_lancamentos_status_idx on public.financeiro_lancamentos(status);
create index if not exists financeiro_lancamentos_conta_idx on public.financeiro_lancamentos(conta_id);
create index if not exists financeiro_lancamentos_pedido_idx on public.financeiro_lancamentos(pedido_id);

create or replace function public.financeiro_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists financeiro_contas_updated_at on public.financeiro_contas;
create trigger financeiro_contas_updated_at before update on public.financeiro_contas
for each row execute function public.financeiro_set_updated_at();

drop trigger if exists financeiro_lancamentos_updated_at on public.financeiro_lancamentos;
create trigger financeiro_lancamentos_updated_at before update on public.financeiro_lancamentos
for each row execute function public.financeiro_set_updated_at();

alter table public.financeiro_contas enable row level security;
alter table public.financeiro_categorias enable row level security;
alter table public.financeiro_lancamentos enable row level security;

insert into public.financeiro_contas (nome, tipo) values
  ('Caixa', 'caixa'),
  ('Pix', 'pix')
on conflict (nome) do nothing;

insert into public.financeiro_categorias (nome, tipo) values
  ('Venda de produtos', 'receita'),
  ('Outras receitas', 'receita'),
  ('Matéria-prima', 'despesa'),
  ('Embalagens', 'despesa'),
  ('Frete e combustível', 'despesa'),
  ('Publicidade', 'despesa'),
  ('Taxas bancárias e cartão', 'despesa'),
  ('DAS-MEI', 'despesa'),
  ('Equipamentos', 'despesa'),
  ('Outras despesas', 'despesa')
on conflict (nome, tipo) do nothing;
