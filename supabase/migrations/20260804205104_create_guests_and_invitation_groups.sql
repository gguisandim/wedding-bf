-- =========================================================
-- ENUMS
-- =========================================================

do $$
begin
  create type public.guest_confirmation_status as enum (
    'pending',
    'confirmed',
    'declined'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.guest_side as enum (
    'bride',
    'groom',
    'both'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.save_the_date_status as enum (
    'not_ready',
    'ready',
    'sent',
    'delivered'
  );
exception
  when duplicate_object then null;
end
$$;

-- =========================================================
-- GRUPOS DE CONVITE
-- =========================================================

create table public.invitation_groups (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  name text not null,

  invitation_code text not null,

  save_the_date_status
    public.save_the_date_status
    not null
    default 'not_ready',

  recipient_name text,

  postal_code text,
  street text,
  street_number text,
  complement text,
  neighborhood text,
  city text,
  state text,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invitation_groups_name_not_empty
    check (length(trim(name)) > 0),

  constraint invitation_groups_code_not_empty
    check (length(trim(invitation_code)) > 0),

  constraint invitation_groups_state_format
    check (
      state is null
      or state ~ '^[A-Z]{2}$'
    ),

  unique (wedding_id, invitation_code),
  unique (id, wedding_id)
);

-- =========================================================
-- CONVIDADOS
-- =========================================================

create table public.guests (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  invitation_group_id uuid not null,

  full_name text not null,
  preferred_name text,

  email text,
  phone text,

  side public.guest_side
    not null
    default 'both',

  confirmation_status
    public.guest_confirmation_status
    not null
    default 'pending',

  is_primary boolean
    not null
    default false,

  is_child boolean
    not null
    default false,

  linked_guest_id uuid,
  relationship_label text,

  dietary_restrictions text,
  notes text,

  responded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint guests_full_name_not_empty
    check (length(trim(full_name)) > 0),

  constraint guests_not_linked_to_self
    check (
      linked_guest_id is null
      or linked_guest_id <> id
    ),

  constraint guests_group_wedding_fk
    foreign key (
      invitation_group_id,
      wedding_id
    )
    references public.invitation_groups (
      id,
      wedding_id
    )
    on delete cascade,

  constraint guests_linked_guest_wedding_fk
    foreign key (
      linked_guest_id,
      wedding_id
    )
    references public.guests (
      id,
      wedding_id
    )
    on delete set null,

  unique (id, wedding_id)
);

-- =========================================================
-- ÍNDICES
-- =========================================================

create index invitation_groups_wedding_id_idx
  on public.invitation_groups(wedding_id);

create index invitation_groups_code_idx
  on public.invitation_groups(
    wedding_id,
    invitation_code
  );

create index guests_wedding_id_idx
  on public.guests(wedding_id);

create index guests_invitation_group_id_idx
  on public.guests(invitation_group_id);

create index guests_confirmation_status_idx
  on public.guests(
    wedding_id,
    confirmation_status
  );

create index guests_linked_guest_id_idx
  on public.guests(linked_guest_id);

create unique index guests_one_primary_per_group_idx
  on public.guests(invitation_group_id)
  where is_primary = true;

-- =========================================================
-- UPDATED_AT
-- =========================================================

create trigger set_invitation_groups_updated_at
before update on public.invitation_groups
for each row
execute function public.set_updated_at();

create trigger set_guests_updated_at
before update on public.guests
for each row
execute function public.set_updated_at();

-- =========================================================
-- RLS
-- =========================================================

alter table public.invitation_groups
  enable row level security;

alter table public.guests
  enable row level security;

-- Leitura para integrantes do casamento

create policy
  "Wedding members can read invitation groups"
on public.invitation_groups
for select
to authenticated
using (
  private.is_wedding_member(wedding_id)
);

create policy
  "Wedding members can read guests"
on public.guests
for select
to authenticated
using (
  private.is_wedding_member(wedding_id)
);

-- Escrita somente para owner/admin

create policy
  "Wedding managers can create invitation groups"
on public.invitation_groups
for insert
to authenticated
with check (
  private.can_manage_wedding(wedding_id)
);

create policy
  "Wedding managers can update invitation groups"
on public.invitation_groups
for update
to authenticated
using (
  private.can_manage_wedding(wedding_id)
)
with check (
  private.can_manage_wedding(wedding_id)
);

create policy
  "Wedding managers can delete invitation groups"
on public.invitation_groups
for delete
to authenticated
using (
  private.can_manage_wedding(wedding_id)
);

create policy
  "Wedding managers can create guests"
on public.guests
for insert
to authenticated
with check (
  private.can_manage_wedding(wedding_id)
);

create policy
  "Wedding managers can update guests"
on public.guests
for update
to authenticated
using (
  private.can_manage_wedding(wedding_id)
)
with check (
  private.can_manage_wedding(wedding_id)
);

create policy
  "Wedding managers can delete guests"
on public.guests
for delete
to authenticated
using (
  private.can_manage_wedding(wedding_id)
);

-- =========================================================
-- PERMISSÕES
-- =========================================================

revoke all
on public.invitation_groups
from anon;

revoke all
on public.guests
from anon;

grant select, insert, update, delete
on public.invitation_groups
to authenticated;

grant select, insert, update, delete
on public.guests
to authenticated;