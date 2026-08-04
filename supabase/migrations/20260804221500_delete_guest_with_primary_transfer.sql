create or replace function public.delete_guest_with_primary_transfer(
  p_guest_id uuid,
  p_new_primary_guest_id uuid default null
)
returns text
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  v_wedding_id uuid;
  v_invitation_group_id uuid;
  v_is_primary boolean;
  v_group_guest_count integer;
begin
  select
    wedding_id,
    invitation_group_id,
    is_primary
  into
    v_wedding_id,
    v_invitation_group_id,
    v_is_primary
  from public.guests
  where id = p_guest_id;

  if not found then
    raise exception using
      message = 'guest_not_found',
      errcode = 'P0001';
  end if;

  if not private.can_manage_wedding(v_wedding_id) then
    raise exception using
      message = 'forbidden',
      errcode = 'P0001';
  end if;

  select count(*)::integer
  into v_group_guest_count
  from public.guests
  where wedding_id = v_wedding_id
    and invitation_group_id = v_invitation_group_id;

  if v_group_guest_count = 1 then
    delete from public.invitation_groups
    where id = v_invitation_group_id
      and wedding_id = v_wedding_id;

    return 'invitation_deleted';
  end if;

  if not v_is_primary then
    update public.guests
    set
      linked_guest_id = null,
      relationship_label = null
    where wedding_id = v_wedding_id
      and linked_guest_id = p_guest_id;

    delete from public.guests
    where id = p_guest_id
      and wedding_id = v_wedding_id;

    return 'guest_deleted';
  end if;

  if p_new_primary_guest_id is null then
    raise exception using
      message = 'new_primary_required',
      errcode = 'P0001';
  end if;

  perform 1
  from public.guests
  where id = p_new_primary_guest_id
    and id <> p_guest_id
    and wedding_id = v_wedding_id
    and invitation_group_id = v_invitation_group_id;

  if not found then
    raise exception using
      message = 'invalid_new_primary',
      errcode = 'P0001';
  end if;

  update public.guests
  set is_primary = false
  where id = p_guest_id
    and wedding_id = v_wedding_id;

  update public.guests
  set
    is_primary = true,
    linked_guest_id = null,
    relationship_label = null
  where id = p_new_primary_guest_id
    and wedding_id = v_wedding_id
    and invitation_group_id = v_invitation_group_id;

  update public.guests
  set
    linked_guest_id = p_new_primary_guest_id,
    relationship_label = null
  where wedding_id = v_wedding_id
    and invitation_group_id = v_invitation_group_id
    and linked_guest_id = p_guest_id
    and id <> p_new_primary_guest_id;

  delete from public.guests
  where id = p_guest_id
    and wedding_id = v_wedding_id;

  return 'primary_transferred';
end;
$$;

revoke all
on function public.delete_guest_with_primary_transfer(uuid, uuid)
from public;

revoke all
on function public.delete_guest_with_primary_transfer(uuid, uuid)
from anon;

grant execute
on function public.delete_guest_with_primary_transfer(uuid, uuid)
to authenticated;
