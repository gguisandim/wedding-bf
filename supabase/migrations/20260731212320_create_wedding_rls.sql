-- =========================================================
-- SEGURANÇA E AUTORIZAÇÃO DO CASAMENTO
-- =========================================================

-- Esta migration adiciona:
-- 1. Identificação do membro: noiva, noivo, cerimonialista etc.
-- 2. Funções privadas de autorização.
-- 3. Políticas RLS das tabelas principais.
-- 4. Preparação para páginas exclusivas, como vestido da noiva.

-- =========================================================
-- TIPO DE MEMBRO
-- =========================================================

do $$
begin
  create type public.wedding_member_type as enum (
    'bride',
    'groom',
    'planner',
    'developer',
    'other'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.wedding_members
add column if not exists member_type public.wedding_member_type
not null
default 'other';

create index if not exists wedding_members_member_type_idx
on public.wedding_members (
  wedding_id,
  member_type
);

-- =========================================================
-- SCHEMA PRIVADO
-- =========================================================

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- =========================================================
-- FUNÇÕES DE AUTORIZAÇÃO
-- =========================================================

-- Verifica se o usuário autenticado pertence ao casamento.
create or replace function private.is_wedding_member(
  target_wedding_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = target_wedding_id
      and member.user_id = (select auth.uid())
  );
$$;

-- Verifica se o usuário pode administrar o casamento.
-- Owner e admin possuem acesso administrativo geral.
create or replace function private.can_manage_wedding(
  target_wedding_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = target_wedding_id
      and member.user_id = (select auth.uid())
      and member.role in (
        'owner'::public.wedding_member_role,
        'admin'::public.wedding_member_role
      )
  );
$$;

-- Verifica se o usuário é proprietário do casamento.
create or replace function private.is_wedding_owner(
  target_wedding_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = target_wedding_id
      and member.user_id = (select auth.uid())
      and member.role = 'owner'::public.wedding_member_role
  );
$$;

-- Verifica o tipo do usuário dentro do casamento.
-- Essa função permitirá criar páginas privadas por perfil.
create or replace function private.has_wedding_member_type(
  target_wedding_id uuid,
  required_member_type public.wedding_member_type
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = target_wedding_id
      and member.user_id = (select auth.uid())
      and member.member_type = required_member_type
  );
$$;

-- Função específica para recursos exclusivos da noiva.
create or replace function private.is_wedding_bride(
  target_wedding_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_wedding_member_type(
    target_wedding_id,
    'bride'::public.wedding_member_type
  );
$$;

-- =========================================================
-- PERMISSÕES DAS FUNÇÕES
-- =========================================================

revoke all on function private.is_wedding_member(uuid)
from public;

revoke all on function private.can_manage_wedding(uuid)
from public;

revoke all on function private.is_wedding_owner(uuid)
from public;

revoke all on function private.has_wedding_member_type(
  uuid,
  public.wedding_member_type
)
from public;

revoke all on function private.is_wedding_bride(uuid)
from public;

grant execute on function private.is_wedding_member(uuid)
to authenticated;

grant execute on function private.can_manage_wedding(uuid)
to authenticated;

grant execute on function private.is_wedding_owner(uuid)
to authenticated;

grant execute on function private.has_wedding_member_type(
  uuid,
  public.wedding_member_type
)
to authenticated;

grant execute on function private.is_wedding_bride(uuid)
to authenticated;

-- =========================================================
-- ATIVAR ROW LEVEL SECURITY
-- =========================================================

alter table public.weddings
enable row level security;

alter table public.wedding_members
enable row level security;

alter table public.wedding_settings
enable row level security;

-- Não usamos FORCE ROW LEVEL SECURITY aqui.
-- As funções security definer precisam consultar wedding_members
-- sem gerar recursão nas próprias políticas.

-- =========================================================
-- POLICIES: WEDDINGS
-- =========================================================

create policy "Wedding members can view wedding"
on public.weddings
for select
to authenticated
using (
  private.is_wedding_member(id)
);

create policy "Wedding managers can update wedding"
on public.weddings
for update
to authenticated
using (
  private.can_manage_wedding(id)
)
with check (
  private.can_manage_wedding(id)
);

-- =========================================================
-- POLICIES: WEDDING MEMBERS
-- =========================================================

-- O usuário pode consultar seu próprio vínculo.
-- Owner e admin podem consultar todos os membros do casamento.
create policy "Members can view wedding memberships"
on public.wedding_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.can_manage_wedding(wedding_id)
);

-- Apenas owners podem adicionar usuários ao casamento.
create policy "Wedding owners can add members"
on public.wedding_members
for insert
to authenticated
with check (
  private.is_wedding_owner(wedding_id)
);

-- Apenas owners podem alterar papel e tipo dos membros.
create policy "Wedding owners can update members"
on public.wedding_members
for update
to authenticated
using (
  private.is_wedding_owner(wedding_id)
)
with check (
  private.is_wedding_owner(wedding_id)
);

-- Apenas owners podem remover membros.
create policy "Wedding owners can remove members"
on public.wedding_members
for delete
to authenticated
using (
  private.is_wedding_owner(wedding_id)
);

-- =========================================================
-- POLICIES: WEDDING SETTINGS
-- =========================================================

create policy "Wedding members can view settings"
on public.wedding_settings
for select
to authenticated
using (
  private.is_wedding_member(wedding_id)
);

create policy "Wedding managers can create settings"
on public.wedding_settings
for insert
to authenticated
with check (
  private.can_manage_wedding(wedding_id)
);

create policy "Wedding managers can update settings"
on public.wedding_settings
for update
to authenticated
using (
  private.can_manage_wedding(wedding_id)
)
with check (
  private.can_manage_wedding(wedding_id)
);