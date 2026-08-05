create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  title text not null,
  description text,

  event_date date not null,
  start_time time,
  end_time time,
  all_day boolean not null default false,

  category text not null default 'Compromisso',
  location text,

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

  status text not null default 'planned'
    check (
      status in (
        'planned',
        'completed',
        'cancelled'
      )
    ),

  priority text not null default 'normal'
    check (
      priority in (
        'normal',
        'high'
      )
    ),

  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calendar_events_id_wedding_key
    unique (id, wedding_id),

  constraint calendar_events_time_order_check
    check (
      start_time is null
      or end_time is null
      or end_time > start_time
    ),

  constraint calendar_events_all_day_time_check
    check (
      all_day = false
      or (
        start_time is null
        and end_time is null
      )
    )
);

create index calendar_events_wedding_date_idx
  on public.calendar_events (
    wedding_id,
    event_date,
    start_time
  );

create index calendar_events_wedding_status_idx
  on public.calendar_events (
    wedding_id,
    status,
    event_date
  );

alter table public.calendar_events
  enable row level security;

create policy "Wedding members can read calendar events"
on public.calendar_events
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = calendar_events.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage calendar events"
on public.calendar_events
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = calendar_events.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = calendar_events.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

grant select, insert, update, delete
  on public.calendar_events
  to authenticated;
