-- supabase/schema.sql
-- Run once to set up the database schema.
-- ADMIN EMAIL placeholder is 'mohanpanwar2005@gmail.com' inside is_admin().

--------------------------------------------------------------------
-- 1. is_admin()
--------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public, auth
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'mohanpanwar2005@gmail.com'
$$;
-- change the email here if needed

--------------------------------------------------------------------
-- 2. comments table and related objects
--------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (char_length(post_slug) between 1 and 200),
  parent_id uuid null references public.comments(id) on delete cascade,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists comments_post_slug_created_at_idx
  on public.comments (post_slug, created_at desc);

--------------------------------------------------------------------
-- Trigger function to fill author data
--------------------------------------------------------------------
create or replace function public.comments_fill_author()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_meta jsonb;
  v_email text;
begin
  select raw_user_meta_data, email into v_meta, v_email
  from auth.users
  where id = NEW.user_id;

  if v_meta is not null then
    NEW.author_name := coalesce(
      nullif(v_meta->>'full_name',''),
      nullif(v_meta->>'name',''),
      nullif(v_meta->>'user_name',''),
      nullif(split_part(coalesce(v_email, ''), '@', 1), ''),
      'Anonymous'
    );
    NEW.author_avatar := nullif(v_meta->>'avatar_url','');
  else
    NEW.author_name := 'Anonymous';
    NEW.author_avatar := null;
  end if;

  NEW.deleted_at := null; -- ensure client cannot set it
  return NEW;
end;
$$;

drop trigger if exists comments_fill_author_trigger on public.comments;
create trigger comments_fill_author_trigger
before insert on public.comments
for each row
execute function public.comments_fill_author();

--------------------------------------------------------------------
-- Row level security and policies for comments
--------------------------------------------------------------------
alter table public.comments enable row level security;

drop policy if exists "comments are public" on public.comments;
create policy "comments are public"
on public.comments
for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "signed-in users can comment" on public.comments;
create policy "signed-in users can comment"
on public.comments
for insert
to authenticated
with check (user_id = auth.uid());

-- No update or delete policies; inserts only via the trigger

--------------------------------------------------------------------
-- Privileges for comments
--------------------------------------------------------------------
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (post_slug, parent_id, user_id, body) on public.comments to authenticated;

--------------------------------------------------------------------
-- Function to soft‑delete a comment and its descendants
--------------------------------------------------------------------
create or replace function public.delete_comment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.comments where id = p_id;
  if v_owner is null then
    raise exception 'Comment not found';
  end if;

  if v_owner <> auth.uid() and not public.is_admin() then
    raise exception 'not allowed';
  end if;

  with recursive descendants as (
    select id from public.comments where id = p_id
    union all
    select c.id
    from public.comments c
    join descendants d on c.parent_id = d.id
  )
  update public.comments
  set deleted_at = now()
  where id in (select id from descendants)
    and deleted_at is null;
end;
$$;

revoke execute on function public.delete_comment(uuid) from public, anon;
grant execute on function public.delete_comment(uuid) to authenticated;

--------------------------------------------------------------------
-- 3. likes table and functions (v1: anyone can like)
--------------------------------------------------------------------
create table if not exists public.likes (
  post_slug text not null check (char_length(post_slug) between 1 and 200),
  client_id text not null check (char_length(client_id) between 8 and 100),
  created_at timestamptz not null default now(),
  unique (post_slug, client_id)
);

alter table public.likes enable row level security;
revoke all on public.likes from anon, authenticated;
-- No policies – access only via functions

--------------------------------------------------------------------
-- Likes functions
--------------------------------------------------------------------
create or replace function public.like_post(p_slug text, p_client_id text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.likes (post_slug, client_id)
  values (p_slug, p_client_id)
  on conflict do nothing;
end;
$$;

create or replace function public.unlike_post(p_slug text, p_client_id text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from public.likes
  where post_slug = p_slug
    and client_id = p_client_id;
end;
$$;

create or replace function public.get_likes(p_slug text, p_client_id text)
returns table(like_count bigint, liked boolean)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    count(*) as like_count,
    coalesce(bool_or(client_id = p_client_id), false) as liked
  from public.likes
  where post_slug = p_slug;
$$;

revoke execute on function public.like_post(text, text) from public;
revoke execute on function public.unlike_post(text, text) from public;
revoke execute on function public.get_likes(text, text) from public;
grant execute on function public.like_post(text, text) to anon, authenticated;
grant execute on function public.unlike_post(text, text) to anon, authenticated;
grant execute on function public.get_likes(text, text) to anon, authenticated;

--------------------------------------------------------------------
-- 4. post view counters
--------------------------------------------------------------------
create table if not exists public.post_views (
  post_slug text primary key check (char_length(post_slug) between 1 and 200),
  count bigint not null default 0
);

alter table public.post_views enable row level security;
revoke all on public.post_views from anon, authenticated;
-- No policies – functions control access

--------------------------------------------------------------------
-- View counter functions
--------------------------------------------------------------------
create or replace function public.increment_view(slug text)
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_cnt bigint;
begin
  insert into public.post_views (post_slug, count)
  values (slug, 1)
  on conflict (post_slug) do update
    set count = public.post_views.count + 1
  returning count into v_cnt;

  return v_cnt;
end;
$$;

create or replace function public.get_view_counts()
returns table(post_slug text, count bigint)
language sql
stable
security definer
set search_path = public, auth
as $$
  select pv.post_slug, pv.count
  from public.post_views pv;
$$;

revoke execute on function public.increment_view(text) from public;
revoke execute on function public.get_view_counts() from public;
grant execute on function public.increment_view(text) to anon, authenticated;
grant execute on function public.get_view_counts() to anon, authenticated;