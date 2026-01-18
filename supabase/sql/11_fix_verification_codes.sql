-- 1) Se a tabela já existe, adiciona user_id e já torna NOT NULL.
-- (Como está tudo vazio, não tem risco de falhar por dados antigos.)
alter table public.verification_codes
add column if not exists user_id uuid;

alter table public.verification_codes
alter column user_id set not null;

-- 2) FK -> public.users(id)
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'verification_codes'
      and constraint_name = 'verification_codes_user_id_fkey'
  ) then
    alter table public.verification_codes
      add constraint verification_codes_user_id_fkey
      foreign key (user_id)
      references public.users(id)
      on delete cascade;
  end if;
end $$;

-- 3) Índice para acelerar consultas
create index if not exists idx_verification_codes_user_id
on public.verification_codes(user_id);

-- 4) Garantir só 1 código ativo por user + type
create unique index if not exists uq_verification_codes_active_user_type
on public.verification_codes(user_id, type)
where used = false;