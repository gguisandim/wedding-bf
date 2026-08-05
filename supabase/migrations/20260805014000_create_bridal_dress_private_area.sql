create table public.bridal_dress_options (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  title text not null,

  atelier_name text,

  status text not null default 'inspiration'
    check (
      status in (
        'inspiration',
        'shortlisted',
        'fitting',
        'chosen',
        'discarded'
      )
    ),

  estimated_amount numeric(12, 2) not null default 0
    check (estimated_amount >= 0),

  final_amount numeric(12, 2)
    check (
      final_amount is null
      or final_amount >= 0
    ),

  image_url text,

  is_favorite boolean not null default false,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bridal_dress_options_id_wedding_key
    unique (id, wedding_id)
);

create table public.bridal_dress_appointments (
  id uuid primary key default gen_random_uuid(),

  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  dress_option_id uuid,

  title text not null,

  appointment_at timestamptz not null,

  location text,

  completed boolean not null default false,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bridal_dress_appointments_option_fk
    foreign key (
      dress_option_id,
      wedding_id
    )
    references public.bridal_dress_options(
      id,
      wedding_id
    )
    on delete set null
);

create index bridal_dress_options_wedding_status_idx
  on public.bridal_dress_options (
    wedding_id,
    status,
    is_favorite desc,
    created_at desc
  );

create index bridal_dress_appointments_wedding_date_idx
  on public.bridal_dress_appointments (
    wedding_id,
    appointment_at
  );

alter table public.bridal_dress_options
  enable row level security;

alter table public.bridal_dress_appointments
  enable row level security;

create policy "Bride private area can read dress options"
on public.bridal_dress_options
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      bridal_dress_options.wedding_id
      and member.user_id = auth.uid()
      and member.member_type::text in (
        'bride',
        'developer'
      )
  )
);

create policy "Bride private area can manage dress options"
on public.bridal_dress_options
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      bridal_dress_options.wedding_id
      and member.user_id = auth.uid()
      and member.member_type::text in (
        'bride',
        'developer'
      )
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
      bridal_dress_options.wedding_id
      and member.user_id = auth.uid()
      and member.member_type::text in (
        'bride',
        'developer'
      )
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

create policy "Bride private area can read appointments"
on public.bridal_dress_appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      bridal_dress_appointments.wedding_id
      and member.user_id = auth.uid()
      and member.member_type::text in (
        'bride',
        'developer'
      )
  )
);

create policy "Bride private area can manage appointments"
on public.bridal_dress_appointments
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id =
      bridal_dress_appointments.wedding_id
      and member.user_id = auth.uid()
      and member.member_type::text in (
        'bride',
        'developer'
      )
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
      bridal_dress_appointments.wedding_id
      and member.user_id = auth.uid()
      and member.member_type::text in (
        'bride',
        'developer'
      )
      and member.role::text in (
        'owner',
        'admin'
      )
  )
);

grant select, insert, update, delete
  on public.bridal_dress_options,
     public.bridal_dress_appointments
  to authenticated;
