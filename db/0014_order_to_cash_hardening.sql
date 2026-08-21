-- =====================================================================
-- 0014 — Order-to-cash and role-security hardening
-- =====================================================================

begin;

-- A person can choose buyer or seller during onboarding, but only an
-- existing administrator can grant or retain the administrator role.
create or replace function public.guard_profiles_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role not in ('buyer', 'seller') then
      new.role := 'buyer';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
     and (old.role = 'admin' or new.role = 'admin') then
    raise exception 'Forbidden: only an administrator can assign the admin role'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_role_guard on public.profiles;
create trigger trg_profiles_role_guard
  before insert or update on public.profiles
  for each row execute function public.guard_profiles_role();

-- A vehicle can have only one open order at a time. This prevents two
-- buyers from paying for the same listing during a race condition.
create unique index if not exists transactions_one_open_order_per_car_idx
  on public.transactions (car_id)
  where status in (
    'pending', 'awaiting_manual_payment', 'payment_received',
    'admin_reviewing', 'disputed'
  );

commit;
