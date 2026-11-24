-- Ambiente minimo para exercitar a migration 20261123180000_climate_survey_engine.sql
-- fora do Supabase: auth.uid() por GUC, roles, enum, as 5 tabelas climate_* e as
-- politicas ORIGINAIS (as que a migration endurece). Nao e' migration.
create extension if not exists pgcrypto;

create role anon nologin;
create role authenticated nologin;

create schema if not exists auth;
create function auth.uid() returns uuid language sql stable
  as 'select nullif(current_setting(''app.user_id'', true), '''')::uuid';
create function public.has_role(_user_id uuid, _role text) returns boolean language sql stable
  as 'select coalesce(current_setting(''app.is_admin'', true), '''') = ''true''';

create table public.departments (id uuid primary key default gen_random_uuid());

create type public.climate_pillar as enum (
  'recognition','autonomy','growth','leadership','peers','purpose','environment','communication','benefits','balance'
);

create table public.climate_surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  survey_type text not null default 'weekly',
  status text not null default 'draft',
  created_by uuid not null,
  department_id uuid references public.departments(id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default now(),
  is_anonymous boolean not null default true,
  allow_skip boolean not null default true,
  send_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.climate_survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.climate_surveys(id) on delete cascade,
  pillar public.climate_pillar not null,
  question_text text not null,
  question_type text not null default 'likert_5',
  options jsonb,
  is_required boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.climate_survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.climate_surveys(id) on delete cascade,
  user_id uuid not null,
  is_complete boolean not null default false,
  completion_time_seconds integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.climate_question_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.climate_survey_responses(id) on delete cascade,
  question_id uuid not null references public.climate_survey_questions(id) on delete cascade,
  score integer,
  text_answer text,
  selected_options jsonb,
  skipped boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.climate_pillar_scores (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.climate_surveys(id) on delete cascade,
  department_id uuid references public.departments(id),
  pillar public.climate_pillar not null,
  score numeric(5,2) not null,
  response_count integer not null default 0,
  previous_score numeric(5,2),
  trend text check (trend in ('up','down','stable')),
  calculated_at timestamptz not null default now(),
  unique (survey_id, department_id, pillar)
);

-- Grants como no Supabase: o cliente tem privilegio de tabela; quem barra e' a RLS.
grant usage on schema public, auth to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.climate_surveys enable row level security;
alter table public.climate_survey_questions enable row level security;
alter table public.climate_survey_responses enable row level security;
alter table public.climate_question_answers enable row level security;
alter table public.climate_pillar_scores enable row level security;

-- Politicas originais (supabase/migrations/20251225223108_...sql)
create policy "Managers can create climate surveys"
on public.climate_surveys for insert
with check (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'manager'));

create policy "Everyone can view active surveys"
on public.climate_surveys for select
using (status in ('active', 'completed') or created_by = auth.uid() or has_role(auth.uid(), 'admin'));

create policy "Creators can update surveys"
on public.climate_surveys for update
using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

create policy "Admins can delete surveys"
on public.climate_surveys for delete
using (has_role(auth.uid(), 'admin'));

create policy "View survey questions"
on public.climate_survey_questions for select
using (exists (select 1 from climate_surveys s where s.id = survey_id and (s.status in ('active','completed') or s.created_by = auth.uid() or has_role(auth.uid(), 'admin'))));

create policy "Manage survey questions"
on public.climate_survey_questions for all
using (exists (select 1 from climate_surveys s where s.id = survey_id and (s.created_by = auth.uid() or has_role(auth.uid(), 'admin'))));

create policy "Users can submit responses"
on public.climate_survey_responses for insert
with check (auth.uid() = user_id);

create policy "Users can view own responses"
on public.climate_survey_responses for select
using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));

create policy "Users can update own responses"
on public.climate_survey_responses for update
using (user_id = auth.uid());

create policy "Users can answer questions"
on public.climate_question_answers for insert
with check (exists (select 1 from climate_survey_responses r where r.id = response_id and r.user_id = auth.uid()));

create policy "Users view own answers"
on public.climate_question_answers for select
using (exists (select 1 from climate_survey_responses r where r.id = response_id and (r.user_id = auth.uid() or has_role(auth.uid(), 'admin'))));

create policy "Users update own answers"
on public.climate_question_answers for update
using (exists (select 1 from climate_survey_responses r where r.id = response_id and r.user_id = auth.uid()));

create policy "Managers can view pillar scores"
on public.climate_pillar_scores for select
using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'manager'));

create policy "System can manage pillar scores"
on public.climate_pillar_scores for all
using (has_role(auth.uid(), 'admin'));