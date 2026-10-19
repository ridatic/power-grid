-- Power-Grid : schéma de la base (Supabase / PostgreSQL)
-- À coller dans l'éditeur SQL du tableau de bord, puis « Run ». Peut être rejoué sans risque.
-- Chaque utilisateur ne voit et ne modifie que ses propres modèles (Row Level Security).

-- ---------------------------------------------------------------------------
-- Documents de l'utilisateur : fichiers et modèles (thème, navigation, pages et zones)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null default 'Mon modèle',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Deux sortes de documents : les fichiers (rapports en cours) et les modeles (points de depart reutilisables).
alter table public.projects add column if not exists kind text not null default 'file';
alter table public.projects drop constraint if exists projects_kind_check;
alter table public.projects add constraint projects_kind_check check (kind in ('file', 'model'));

create index if not exists projects_user_updated_idx on public.projects (user_id, updated_at desc);
create index if not exists projects_user_kind_idx on public.projects (user_id, kind, updated_at desc);

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete to authenticated using (user_id = (select auth.uid()));

-- Date de dernière modification, tenue par la base.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Bibliothèque d'images de l'utilisateur (logos, photos, captures), réutilisables dans tous les fichiers.
-- Images réduites dans le navigateur avant l'envoi.
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null default 'image',
  data_url    text not null check (length(data_url) < 1500000),
  created_at  timestamptz not null default now()
);

create index if not exists media_user_idx on public.media (user_id, created_at desc);

alter table public.media enable row level security;

drop policy if exists "media_select_own" on public.media;
create policy "media_select_own" on public.media
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "media_insert_own" on public.media;
create policy "media_insert_own" on public.media
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "media_delete_own" on public.media;
create policy "media_delete_own" on public.media
  for delete to authenticated using (user_id = (select auth.uid()));

-- L'API voit tout de suite les nouvelles tables et colonnes.
notify pgrst, 'reload schema';
