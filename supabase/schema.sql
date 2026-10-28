-- ============================================================
-- Dashx Database Schema
-- Run this in your Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Categories ──────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#6b7280',
  icon        text not null default 'folder',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: owner full access"
  on public.categories
  for all
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists categories_user_id_idx on public.categories(user_id);

-- ─── Collections ─────────────────────────────────────────────
create table if not exists public.collections (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "collections: owner full access"
  on public.collections
  for all
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists collections_user_id_idx on public.collections(user_id);

-- ─── Tags ────────────────────────────────────────────────────
create table if not exists public.tags (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#6b7280',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.tags enable row level security;

create policy "tags: owner full access"
  on public.tags
  for all
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists tags_user_id_idx on public.tags(user_id);

-- ─── Resources ───────────────────────────────────────────────
create table if not exists public.resources (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  url             text not null,
  title           text not null,
  description     text,
  notes           text,
  favicon_url     text,
  domain          text,
  resource_type   text not null default 'website'
                    check (resource_type in ('website','tutorial','article','course','github','design','ai_tool','ai_chat','other')),
  category_id     uuid references public.categories(id) on delete set null,
  is_favorite     boolean not null default false,
  is_archived     boolean not null default false,
  last_opened_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "resources: owner full access"
  on public.resources
  for all
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists resources_user_id_idx        on public.resources(user_id);
create index if not exists resources_created_at_idx     on public.resources(user_id, created_at desc);
create index if not exists resources_is_favorite_idx    on public.resources(user_id, is_favorite) where is_favorite = true;
create index if not exists resources_category_id_idx    on public.resources(category_id);
create index if not exists resources_resource_type_idx  on public.resources(user_id, resource_type);
create index if not exists resources_url_idx            on public.resources(user_id, url);

-- ─── Resource Tags (join table) ───────────────────────────────
create table if not exists public.resource_tags (
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  primary key (resource_id, tag_id)
);

alter table public.resource_tags enable row level security;

create policy "resource_tags: owner full access"
  on public.resource_tags
  for all
  to authenticated
  using  (
    exists (
      select 1 from public.resources r
      where r.id = resource_id and (select auth.uid()) = r.user_id
    )
  )
  with check (
    exists (
      select 1 from public.resources r
      where r.id = resource_id and (select auth.uid()) = r.user_id
    )
  );

-- ─── Collection Resources (join table) ───────────────────────
create table if not exists public.collection_resources (
  collection_id uuid not null references public.collections(id) on delete cascade,
  resource_id   uuid not null references public.resources(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (collection_id, resource_id)
);

alter table public.collection_resources enable row level security;

create policy "collection_resources: owner full access"
  on public.collection_resources
  for all
  to authenticated
  using  (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and (select auth.uid()) = c.user_id
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and (select auth.uid()) = c.user_id
    )
  );

-- ─── Updated-at triggers ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_updated_at  before update on public.categories  for each row execute function public.set_updated_at();
create trigger collections_updated_at before update on public.collections for each row execute function public.set_updated_at();
create trigger resources_updated_at   before update on public.resources   for each row execute function public.set_updated_at();

-- ─── Default categories function ─────────────────────────────
create or replace function public.create_default_categories(p_user_id uuid)
returns void language plpgsql security invoker as $$
begin
  insert into public.categories (user_id, name, color, icon) values
    (p_user_id, 'Graphics Design', '#ec4899', 'pen-tool'),
    (p_user_id, 'UI/UX',           '#f97316', 'layout'),
    (p_user_id, 'Coding',          '#22c55e', 'code-2'),
    (p_user_id, 'AI Tools',        '#a855f7', 'bot'),
    (p_user_id, 'Learning',        '#eab308', 'book-open'),
    (p_user_id, 'Inspiration',     '#06b6d4', 'lightbulb'),
    (p_user_id, 'Projects',        '#ef4444', 'folder-kanban'),
    (p_user_id, 'Other',           '#6b7280', 'more-horizontal')
  on conflict do nothing;
end;
$$;
