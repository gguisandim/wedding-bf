create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  name text not null,
  service_category text,
  contact_name text,
  phone text,
  email text,
  website text,

  status text not null default 'active'
    check (
      status in (
        'prospect',
        'active',
        'completed',
        'cancelled'
      )
    ),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint suppliers_id_wedding_key
    unique (id, wedding_id),

  constraint suppliers_wedding_name_key
    unique (wedding_id, name)
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  supplier_id uuid
    references public.suppliers(id)
    on delete set null,

  name text not null,
  category text not null,

  planned_amount numeric(12, 2) not null default 0
    check (planned_amount >= 0),

  contracted_amount numeric(12, 2) not null default 0
    check (contracted_amount >= 0),

  status text not null default 'planned'
    check (
      status in (
        'planned',
        'quoted',
        'contracted',
        'completed',
        'cancelled'
      )
    ),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_items_id_wedding_key
    unique (id, wedding_id)
);

create table public.budget_installments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  budget_item_id uuid not null,

  description text not null,
  installment_number integer not null default 1
    check (installment_number > 0),

  amount numeric(12, 2) not null
    check (amount > 0),

  due_date date not null,

  paid_amount numeric(12, 2) not null default 0
    check (
      paid_amount >= 0
      and paid_amount <= amount
    ),

  paid_at timestamptz,
  payment_method text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'partially_paid',
        'paid',
        'cancelled'
      )
    ),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_installments_item_fk
    foreign key (
      budget_item_id,
      wedding_id
    )
    references public.budget_items(
      id,
      wedding_id
    )
    on delete cascade,

  constraint budget_installments_id_wedding_key
    unique (id, wedding_id)
);

create table public.payment_attachments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null
    references public.weddings(id)
    on delete cascade,

  installment_id uuid not null,

  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,

  created_at timestamptz not null default now(),

  constraint payment_attachments_installment_fk
    foreign key (
      installment_id,
      wedding_id
    )
    references public.budget_installments(
      id,
      wedding_id
    )
    on delete cascade
);

create index suppliers_wedding_status_idx
  on public.suppliers (
    wedding_id,
    status,
    name
  );

create index budget_items_wedding_category_idx
  on public.budget_items (
    wedding_id,
    category,
    name
  );

create index budget_installments_due_idx
  on public.budget_installments (
    wedding_id,
    due_date,
    status
  );

create index budget_installments_item_idx
  on public.budget_installments (
    wedding_id,
    budget_item_id,
    installment_number
  );

create index payment_attachments_installment_idx
  on public.payment_attachments (
    wedding_id,
    installment_id
  );

alter table public.suppliers
  enable row level security;

alter table public.budget_items
  enable row level security;

alter table public.budget_installments
  enable row level security;

alter table public.payment_attachments
  enable row level security;

create policy "Wedding members can read suppliers"
on public.suppliers
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = suppliers.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage suppliers"
on public.suppliers
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = suppliers.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = suppliers.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

create policy "Wedding members can read budget items"
on public.budget_items
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = budget_items.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage budget items"
on public.budget_items
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = budget_items.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = budget_items.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

create policy "Wedding members can read installments"
on public.budget_installments
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = budget_installments.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage installments"
on public.budget_installments
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = budget_installments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = budget_installments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

create policy "Wedding members can read payment attachments"
on public.payment_attachments
for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = payment_attachments.wedding_id
      and member.user_id = auth.uid()
  )
);

create policy "Wedding managers can manage payment attachments"
on public.payment_attachments
for all
to authenticated
using (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = payment_attachments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.wedding_members as member
    where member.wedding_id = payment_attachments.wedding_id
      and member.user_id = auth.uid()
      and member.role::text in ('owner', 'admin')
  )
);

grant select, insert, update, delete
  on public.suppliers,
     public.budget_items,
     public.budget_installments,
     public.payment_attachments
  to authenticated;
