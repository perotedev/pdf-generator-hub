-- Tabela de usuários do sistema web
create table if not exists public.users (
  id uuid not null default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  name text not null,
  role text not null default 'USER' check (role in ('USER', 'MANAGER', 'ADMIN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  stripe_customer_id text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  last_login timestamp with time zone null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) tablespace pg_default;

-- Índices para melhor performance
create index if not exists idx_users_email on public.users using btree (email) tablespace pg_default;
create index if not exists idx_users_role on public.users using btree (role) tablespace pg_default;
create index if not exists idx_users_stripe_customer_id on public.users using btree (stripe_customer_id) tablespace pg_default;

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row
  execute function public.update_updated_at_column();

-- RLS (Row Level Security)
alter table public.users enable row level security;

-- Políticas de acesso
-- Usuários podem ver apenas seus próprios dados
create policy "Users can view own data"
  on public.users
  for select
  using (auth.uid() = id);

-- Apenas admins podem ver todos os usuários
create policy "Admins can view all users"
  on public.users
  for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Admins e managers podem atualizar usuários
create policy "Admins and managers can update users"
  on public.users
  for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('ADMIN', 'MANAGER')
    )
  );

-- Apenas admins podem deletar usuários
create policy "Only admins can delete users"
  on public.users
  for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );
