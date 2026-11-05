-- AutoConnect car community: posts, comments, likes and photo storage.
-- Safe to run more than once.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  author_avatar_url text,
  kind text not null default 'post'
    check (kind in ('post', 'question', 'build', 'meetup', 'review')),
  title text not null check (char_length(title) between 3 and 140),
  body text not null default '' check (char_length(body) <= 5000),
  image_urls text[] not null default '{}',
  car_make text,
  car_model text,
  car_year int check (car_year is null or car_year between 1900 and 2100),
  location text,
  event_at timestamptz,
  like_count int not null default 0,
  comment_count int not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
create index if not exists community_posts_kind_idx on public.community_posts (kind, created_at desc);
create index if not exists community_posts_author_idx on public.community_posts (author_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  author_avatar_url text,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Author name/avatar are copied from profiles at write time so the feed can be
-- read publicly without exposing the profiles table.
create or replace function public.community_stamp_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_id := auth.uid();
  select coalesce(nullif(p.full_name, ''), 'AutoConnect member'), p.avatar_url
    into new.author_name, new.author_avatar_url
    from public.profiles p
   where p.id = new.author_id;
  if new.author_name is null then
    new.author_name := 'AutoConnect member';
  end if;
  return new;
end;
$$;

drop trigger if exists community_posts_stamp_author on public.community_posts;
create trigger community_posts_stamp_author
  before insert on public.community_posts
  for each row execute function public.community_stamp_author();

drop trigger if exists community_comments_stamp_author on public.community_comments;
create trigger community_comments_stamp_author
  before insert on public.community_comments
  for each row execute function public.community_stamp_author();

create or replace function public.community_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists community_posts_touch on public.community_posts;
create trigger community_posts_touch
  before update on public.community_posts
  for each row execute function public.community_touch_updated_at();

-- Keep like/comment counters in sync.
create or replace function public.community_sync_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
begin
  if tg_table_name = 'community_likes' then
    update public.community_posts
       set like_count = (select count(*) from public.community_likes where post_id = target)
     where id = target;
  else
    update public.community_posts
       set comment_count = (select count(*) from public.community_comments where post_id = target)
     where id = target;
  end if;
  return null;
end;
$$;

drop trigger if exists community_likes_count on public.community_likes;
create trigger community_likes_count
  after insert or delete on public.community_likes
  for each row execute function public.community_sync_counts();

drop trigger if exists community_comments_count on public.community_comments;
create trigger community_comments_count
  after insert or delete on public.community_comments
  for each row execute function public.community_sync_counts();

-- Row level security
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;

grant select on public.community_posts, public.community_comments, public.community_likes to anon, authenticated;
grant insert, update, delete on public.community_posts, public.community_comments to authenticated;
grant insert, delete on public.community_likes to authenticated;

drop policy if exists "community posts are public" on public.community_posts;
create policy "community posts are public" on public.community_posts
  for select using (not is_hidden or author_id = auth.uid());

drop policy if exists "members create posts" on public.community_posts;
create policy "members create posts" on public.community_posts
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "authors edit posts" on public.community_posts;
create policy "authors edit posts" on public.community_posts
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "authors delete posts" on public.community_posts;
create policy "authors delete posts" on public.community_posts
  for delete to authenticated using (author_id = auth.uid());

drop policy if exists "comments are public" on public.community_comments;
create policy "comments are public" on public.community_comments
  for select using (true);

drop policy if exists "members comment" on public.community_comments;
create policy "members comment" on public.community_comments
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "authors delete comments" on public.community_comments;
create policy "authors delete comments" on public.community_comments
  for delete to authenticated using (author_id = auth.uid());

drop policy if exists "likes are public" on public.community_likes;
create policy "likes are public" on public.community_likes
  for select using (true);

drop policy if exists "members like" on public.community_likes;
create policy "members like" on public.community_likes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "members unlike" on public.community_likes;
create policy "members unlike" on public.community_likes
  for delete to authenticated using (user_id = auth.uid());

-- Photo storage: public read, members upload into a folder named after their user id.
insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do nothing;

drop policy if exists "community images are public" on storage.objects;
create policy "community images are public" on storage.objects
  for select using (bucket_id = 'community-images');

drop policy if exists "members upload community images" on storage.objects;
create policy "members upload community images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "members delete own community images" on storage.objects;
create policy "members delete own community images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);
