create table if not exists public.fund_app_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.fund_app_state enable row level security;

drop policy if exists "fund_app_state_select_anon" on public.fund_app_state;
drop policy if exists "fund_app_state_insert_anon" on public.fund_app_state;
drop policy if exists "fund_app_state_update_anon" on public.fund_app_state;

create policy "fund_app_state_select_anon"
on public.fund_app_state
for select
to anon
using (true);

create policy "fund_app_state_insert_anon"
on public.fund_app_state
for insert
to anon
with check (id = 'default');

create policy "fund_app_state_update_anon"
on public.fund_app_state
for update
to anon
using (id = 'default')
with check (id = 'default');

insert into public.fund_app_state (id, state)
values (
  'default',
  '{
    "transactions": [],
    "budgets": [],
    "cashAdvances": [],
    "dicts": {
      "departments": [],
      "projects": [],
      "topics": [],
      "people": [],
      "expenseCategories": []
    }
  }'::jsonb
)
on conflict (id) do nothing;
