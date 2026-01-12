-- ========================
-- Wishes Table (Messages to the newlyweds)
-- ========================
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

alter table public.wishes enable row level security;

-- Anon policies
drop policy if exists "Allow anon to create wishes" on public.wishes;
create policy "Allow anon to create wishes"
  on public.wishes for insert
  to anon
  with check (true);

drop policy if exists "Allow anon to read wishes" on public.wishes;
create policy "Allow anon to read wishes"
  on public.wishes for select
  to anon
  using (true);

drop policy if exists "Allow anon to delete own wishes" on public.wishes;
create policy "Allow anon to delete own wishes"
  on public.wishes for delete
  to anon
  using (true);

-- Authenticated policies
drop policy if exists "Allow authenticated to create wishes" on public.wishes;
create policy "Allow authenticated to create wishes"
  on public.wishes for insert
  to authenticated
  with check (auth.uid() = guest_id);

drop policy if exists "Allow authenticated to read wishes" on public.wishes;
create policy "Allow authenticated to read wishes"
  on public.wishes for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated to delete own wishes" on public.wishes;
create policy "Allow authenticated to delete own wishes"
  on public.wishes for delete
  to authenticated
  using (auth.uid() = guest_id);

-- Grants
grant all on public.wishes to anon;
grant all on public.wishes to authenticated;

-- Index
create index if not exists idx_wishes_guest_id on public.wishes(guest_id);
create index if not exists idx_wishes_created_at on public.wishes(created_at desc);
