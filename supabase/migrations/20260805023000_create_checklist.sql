create table public.checklist_groups (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  title text not null,
  description text,

  tone text not null default 'blue'
    check (
      tone in (
        'blue',
        'green',
        'yellow',
        'terracotta'
      )
    ),

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint checklist_groups_id_wedding_key
    unique (id, wedding_id),

  constraint checklist_groups_wedding_title_key
    unique (wedding_id, title)
);

create table public.checklist_tasks (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  group_id uuid not null,

  title text not null,
  description text,
  due_date date,

  responsible_type text not null default 'couple'
    check (
      responsible_type in (
        'bride',
        'groom',
        'couple',
        'planner',
        'other'
      )
    ),

  responsible_name text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'progress',
        'completed'
      )
    ),

  priority text not null default 'normal'
    check (
      priority in (
        'normal',
        'medium',
        'high'
      )
    ),

  completed_at timestamptz,

  source_type text not null default 'manual'
    check (
      source_type in (
        'manual',
        'ceremony',
        'budget',
        'rsvp',
        'system'
      )
    ),

  source_id uuid,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint checklist_tasks_group_fk
    foreign key (
      group_id,
      wedding_id
    )
    references public.checklist_groups(
      id,
      wedding_id
    )
    on delete cascade,

  constraint checklist_tasks_id_wedding_key
    unique (id, wedding_id)
);

create index checklist_groups_wedding_order_idx
  on public.checklist_groups (
    wedding_id,
    sort_order,
    created_at
  );

create index checklist_tasks_wedding_status_idx
  on public.checklist_tasks (
    wedding_id,
    status,
    due_date
  );

create index checklist_tasks_group_order_idx
  on public.checklist_tasks (
    wedding_id,
    group_id,
    sort_order,
    created_at
  );

create index checklist_tasks_source_idx
  on public.checklist_tasks (
    wedding_id,
    source_type,
    source_id
  );

alter table public.checklist_groups
  enable row level security;

alter table public.checklist_tasks
  enable row level security;

create policy "Wedding members can read checklist groups"
on public.checklist_groups
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = checklist_groups.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage checklist groups"
on public.checklist_groups
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = checklist_groups.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = checklist_groups.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

create policy "Wedding members can read checklist tasks"
on public.checklist_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = checklist_tasks.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage checklist tasks"
on public.checklist_tasks
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = checklist_tasks.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = checklist_tasks.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

grant select, insert, update, delete
  on public.checklist_groups,
     public.checklist_tasks
  to authenticated;
