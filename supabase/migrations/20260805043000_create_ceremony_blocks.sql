create table public.ceremony_blocks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  start_time time not null default '17:00:00',
  duration_minutes integer not null default 10
    check (duration_minutes >= 1 and duration_minutes <= 240),
  title text not null,
  description text,
  responsible text,
  participants text,
  instructions text,
  block_type text not null default 'other'
    check (block_type in (
      'reception', 'entrance', 'music', 'speech', 'ritual',
      'vows', 'signing', 'exit', 'other'
    )),
  status text not null default 'planned'
    check (status in ('planned', 'confirmed', 'attention')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ceremony_blocks_id_wedding_key unique (id, wedding_id)
);

create index ceremony_blocks_wedding_order_idx
  on public.ceremony_blocks (wedding_id, sort_order, created_at);

alter table public.ceremony_blocks enable row level security;

create policy "Wedding members can read ceremony blocks"
on public.ceremony_blocks
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = ceremony_blocks.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage ceremony blocks"
on public.ceremony_blocks
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = ceremony_blocks.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = ceremony_blocks.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

grant select, insert, update, delete
  on public.ceremony_blocks
  to authenticated;
