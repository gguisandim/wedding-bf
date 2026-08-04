create table public.seating_tables (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  name text not null,
  shape text not null default 'round'
    check (shape in ('round', 'rectangular', 'square')),

  capacity integer not null default 8
    check (capacity between 1 and 30),

  position_x double precision not null default 20
    check (position_x between 0 and 100),

  position_y double precision not null default 20
    check (position_y between 0 and 100),

  rotation integer not null default 0
    check (rotation between 0 and 359),

  notes text,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seating_tables_wedding_name_key
    unique (wedding_id, name),

  constraint seating_tables_id_wedding_key
    unique (id, wedding_id)
);

create table public.guest_table_assignments (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  table_id uuid not null,
  guest_id uuid not null,

  seat_number integer
    check (seat_number is null or seat_number > 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint guest_table_assignments_table_fk
    foreign key (table_id, wedding_id)
    references public.seating_tables(id, wedding_id)
    on delete cascade,

  constraint guest_table_assignments_guest_fk
    foreign key (guest_id, wedding_id)
    references public.guests(id, wedding_id)
    on delete cascade,

  constraint guest_table_assignments_guest_key
    unique (wedding_id, guest_id)
);

create unique index guest_table_assignments_seat_key
  on public.guest_table_assignments (
    table_id,
    seat_number
  )
  where seat_number is not null;

create index seating_tables_wedding_sort_idx
  on public.seating_tables (
    wedding_id,
    sort_order,
    name
  );

create index guest_table_assignments_table_idx
  on public.guest_table_assignments (
    wedding_id,
    table_id
  );

alter table public.seating_tables
  enable row level security;

alter table public.guest_table_assignments
  enable row level security;

create policy "Wedding members can read seating tables"
on public.seating_tables
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      seating_tables.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can create seating tables"
on public.seating_tables
for insert
to authenticated
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      seating_tables.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

create policy "Wedding managers can update seating tables"
on public.seating_tables
for update
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      seating_tables.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      seating_tables.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

create policy "Wedding managers can delete seating tables"
on public.seating_tables
for delete
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      seating_tables.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

create policy "Wedding members can read table assignments"
on public.guest_table_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      guest_table_assignments.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can create table assignments"
on public.guest_table_assignments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      guest_table_assignments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

create policy "Wedding managers can update table assignments"
on public.guest_table_assignments
for update
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      guest_table_assignments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      guest_table_assignments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

create policy "Wedding managers can delete table assignments"
on public.guest_table_assignments
for delete
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      guest_table_assignments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

grant select, insert, update, delete
  on public.seating_tables
  to authenticated;

grant select, insert, update, delete
  on public.guest_table_assignments
  to authenticated;
