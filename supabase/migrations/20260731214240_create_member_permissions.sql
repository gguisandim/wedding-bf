create table public.wedding_member_permissions (
  id uuid primary key default gen_random_uuid(),

  wedding_member_id uuid not null
    references public.wedding_members(id)
    on delete cascade,

  permission text not null,

  allowed boolean not null default true,

  created_at timestamptz not null default now(),

  unique (
    wedding_member_id,
    permission
  )
);