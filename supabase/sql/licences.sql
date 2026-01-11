create table public.licenses (
  id uuid not null default gen_random_uuid (),
  code text not null,
  is_used boolean not null default false,
  device_id text null,
  device_type text null,
  expire_date timestamp with time zone null,
  activated_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  client text null,
  company text not null,
  sold boolean not null default false,
  constraint licenses_pkey primary key (id),
  constraint licenses_code_key unique (code)
) TABLESPACE pg_default;

create index IF not exists idx_licenses_code on public.licenses using btree (code) TABLESPACE pg_default;