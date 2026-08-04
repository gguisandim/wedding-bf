-- Cria o enum caso ainda não exista.
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

-- Adiciona o tipo do membro.
alter table public.wedding_members
add column if not exists member_type public.wedding_member_type
not null
default 'other';

-- Índice para consultas por tipo.
create index if not exists wedding_members_member_type_idx
on public.wedding_members (
  wedding_id,
  member_type
);

-- Verifica se o usuário possui determinado tipo no casamento.
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

-- Verifica se o usuário é a noiva.
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

revoke all on function private.has_wedding_member_type(
  uuid,
  public.wedding_member_type
)
from public;

revoke all on function private.is_wedding_bride(uuid)
from public;

grant execute on function private.has_wedding_member_type(
  uuid,
  public.wedding_member_type
)
to authenticated;

grant execute on function private.is_wedding_bride(uuid)
to authenticated;