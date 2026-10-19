-- Persist notification choices without implying that unconnected delivery channels are live.
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  saved_search_alerts boolean not null default true,
  price_drop_alerts boolean not null default true,
  import_updates boolean not null default true,
  transaction_milestones boolean not null default true,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "members manage their notification preferences" on public.notification_preferences;
create policy "members manage their notification preferences"
  on public.notification_preferences for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
