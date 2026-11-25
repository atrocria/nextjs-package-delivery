create table if not exists public.shipping_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  current_step smallint not null default 0 check (current_step between 0 and 3),
  draft_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipping_drafts enable row level security;

grant select, insert, update, delete on public.shipping_drafts to authenticated;

drop policy if exists "Users can read their own shipping drafts" on public.shipping_drafts;
create policy "Users can read their own shipping drafts"
  on public.shipping_drafts for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own shipping drafts" on public.shipping_drafts;
create policy "Users can create their own shipping drafts"
  on public.shipping_drafts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own shipping drafts" on public.shipping_drafts;
create policy "Users can update their own shipping drafts"
  on public.shipping_drafts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own shipping drafts" on public.shipping_drafts;
create policy "Users can delete their own shipping drafts"
  on public.shipping_drafts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_shipping_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_shipping_drafts_updated_at on public.shipping_drafts;
create trigger set_shipping_drafts_updated_at
  before update on public.shipping_drafts
  for each row execute function public.set_shipping_drafts_updated_at();
