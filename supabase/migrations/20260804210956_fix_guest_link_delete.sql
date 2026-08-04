alter table public.guests
drop constraint if exists guests_linked_guest_wedding_fk;

alter table public.guests
add constraint guests_linked_guest_wedding_fk
foreign key (
  linked_guest_id,
  wedding_id
)
references public.guests (
  id,
  wedding_id
)
on delete no action;