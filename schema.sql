-- =====================================================================
-- Tablaturas · esquema de base de datos (PostgreSQL / Supabase)
-- Cómo cargarlo: Supabase → SQL Editor → pegar este archivo → Run.
-- =====================================================================

-- ---------- Perfiles (uno por cuenta; se crea solo al registrarse) ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', new.email),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Proyectos (bandas, orquestas, solistas) y sus miembros ----------
create table public.projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('editor','viewer')),
  primary key (project_id, user_id)
);

-- ---------- Canciones ----------
create table public.songs (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name       text not null,
  bpm        int  not null default 120 check (bpm between 30 and 300),
  cover_path text,                              -- ruta en Storage (bucket "covers")
  lyrics     text  not null default '',
  chords     jsonb not null default '[]',       -- [{a:inicio, b:fin, c:"Am"}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index songs_owner_idx   on public.songs(owner_id);
create index songs_project_idx on public.songs(project_id);

-- ---------- Pistas: una fila por instrumento (se pueden repetir) ----------
create table public.tracks (
  id         uuid primary key default gen_random_uuid(),
  song_id    uuid not null references public.songs(id) on delete cascade,
  instrument text not null check (instrument in ('guitarra','bajo','bateria','piano')),
  name       text not null,
  position   int  not null default 0,
  data       jsonb not null default '[]',       -- matriz filas x columnas (8 columnas = 1 compás)
  audio_path text                               -- ruta en Storage (bucket "audio"), opcional
);
create index tracks_song_idx on public.tracks(song_id);

-- ---------- Compartir una canción con otra cuenta ----------
create table public.song_shares (
  song_id  uuid not null references public.songs(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  can_edit boolean not null default false,
  primary key (song_id, user_id)
);

-- ---------- updated_at automático ----------
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger songs_touch before update on public.songs
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Seguridad (Row Level Security): cada persona ve solo lo suyo
-- =====================================================================
create function public.is_project_member(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects p where p.id = pid and p.owner_id = auth.uid())
      or exists (select 1 from project_members m where m.project_id = pid and m.user_id = auth.uid());
$$;

create function public.can_read_song(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from songs s
    where s.id = sid and (
      s.owner_id = auth.uid()
      or exists (select 1 from song_shares h where h.song_id = s.id and h.user_id = auth.uid())
      or (s.project_id is not null and public.is_project_member(s.project_id))
    ));
$$;

create function public.can_edit_song(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from songs s
    where s.id = sid and (
      s.owner_id = auth.uid()
      or exists (select 1 from song_shares h where h.song_id = s.id and h.user_id = auth.uid() and h.can_edit)
      or exists (select 1 from project_members m where m.project_id = s.project_id and m.user_id = auth.uid() and m.role = 'editor')
    ));
$$;

alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.songs           enable row level security;
alter table public.tracks          enable row level security;
alter table public.song_shares     enable row level security;

-- Perfiles: cualquiera con sesión puede buscar cuentas (para compartir); solo edito el mío
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_upd  on public.profiles for update to authenticated using (id = auth.uid());

-- Proyectos
create policy projects_read on public.projects for select to authenticated using (public.is_project_member(id));
create policy projects_ins  on public.projects for insert to authenticated with check (owner_id = auth.uid());
create policy projects_upd  on public.projects for update to authenticated using (owner_id = auth.uid());
create policy projects_del  on public.projects for delete to authenticated using (owner_id = auth.uid());

create policy members_read on public.project_members for select to authenticated using (public.is_project_member(project_id));
create policy members_all  on public.project_members for all to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

-- Canciones
create policy songs_read on public.songs for select to authenticated using (public.can_read_song(id));
create policy songs_ins  on public.songs for insert to authenticated with check (owner_id = auth.uid());
create policy songs_upd  on public.songs for update to authenticated using (public.can_edit_song(id));
create policy songs_del  on public.songs for delete to authenticated using (owner_id = auth.uid());

-- Pistas (heredan los permisos de la canción)
create policy tracks_read on public.tracks for select to authenticated using (public.can_read_song(song_id));
create policy tracks_ins  on public.tracks for insert to authenticated with check (public.can_edit_song(song_id));
create policy tracks_upd  on public.tracks for update to authenticated using (public.can_edit_song(song_id));
create policy tracks_del  on public.tracks for delete to authenticated using (public.can_edit_song(song_id));

-- Compartidos: los gestiona el dueño de la canción; cada uno ve los suyos
create policy shares_read on public.song_shares for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from songs s where s.id = song_id and s.owner_id = auth.uid()));
create policy shares_all on public.song_shares for all to authenticated
  using (exists (select 1 from songs s where s.id = song_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from songs s where s.id = song_id and s.owner_id = auth.uid()));

-- =====================================================================
-- Archivos: tapas de disco y pistas de audio (Storage), en carpeta por usuario
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('covers','covers',false), ('audio','audio',false)
on conflict (id) do nothing;

create policy files_own on storage.objects for all to authenticated
  using (bucket_id in ('covers','audio') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('covers','audio') and (storage.foldername(name))[1] = auth.uid()::text);
