-- =========================================================
-- FUNDAÇÃO DO CASAMENTO
-- =========================================================

-- Papéis que um usuário pode possuir em um casamento.
create type public.wedding_member_role as enum (
  'owner',
  'admin',
  'viewer'
);

-- Situação geral do casamento.
create type public.wedding_status as enum (
  'active',
  'archived'
);

-- =========================================================
-- CASAMENTOS
-- =========================================================

create table public.weddings (
  id uuid primary key default gen_random_uuid(),

  bride_name text not null,
  groom_name text not null,

  wedding_date date not null,
  wedding_time time,

  venue_name text,
  venue_address text,

  timezone text not null default 'America/Belem',
  currency text not null default 'BRL',

  status public.wedding_status
    not null
    default 'active',

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);

-- =========================================================
-- USUÁRIOS VINCULADOS AO CASAMENTO
-- =========================================================

create table public.wedding_members (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role public.wedding_member_role
    not null
    default 'viewer',

  created_at timestamptz
    not null
    default now(),

  unique (wedding_id, user_id)
);

-- =========================================================
-- CONFIGURAÇÕES DO CASAMENTO
-- =========================================================

create table public.wedding_settings (
  wedding_id uuid primary key
    references public.weddings(id)
    on delete cascade,

  invitation jsonb
    not null
    default '{}'::jsonb,

  gifts jsonb
    not null
    default '{}'::jsonb,

  finance jsonb
    not null
    default '{}'::jsonb,

  notifications jsonb
    not null
    default '{}'::jsonb,

  privacy jsonb
    not null
    default '{}'::jsonb,

  integrations jsonb
    not null
    default '{}'::jsonb,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================

create index wedding_members_user_id_idx
  on public.wedding_members(user_id);

create index wedding_members_wedding_id_idx
  on public.wedding_members(wedding_id);

-- =========================================================
-- ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger weddings_set_updated_at
before update on public.weddings
for each row
execute function public.set_updated_at();

create trigger wedding_settings_set_updated_at
before update on public.wedding_settings
for each row
execute function public.set_updated_at();