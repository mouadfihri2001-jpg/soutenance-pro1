begin;

create table public.accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'offre', 'max')),
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 3 and 500),
  profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object' and octet_length(profile::text) <= 30000),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) <= 30 and octet_length(sources::text) <= 240000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  module text not null check (module in ('plan','references','redaction','questionnaire','interview','dataanalysis','correction','ppt','defense')),
  title text not null check (length(title) between 1 and 500),
  content text not null check (length(content) <= 120000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects(id, user_id) on delete cascade
);
create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  module text not null, status text not null default 'reserved' check (status in ('reserved','completed','failed')),
  input_tokens integer not null default 0, output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index projects_owner on public.projects(user_id);
create index documents_project on public.documents(project_id, updated_at desc);
create index jobs_owner_time on public.ai_jobs(user_id, created_at);

alter table public.accounts enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.ai_jobs enable row level security;
revoke all on public.accounts, public.projects, public.documents, public.ai_jobs from anon, authenticated;
grant select on public.accounts, public.ai_jobs to authenticated;
grant select, insert, update, delete on public.projects, public.documents to authenticated;
grant all on public.accounts, public.projects, public.documents, public.ai_jobs to service_role;
create policy account_read on public.accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy jobs_read on public.ai_jobs for select to authenticated using ((select auth.uid()) = user_id);
create policy project_read on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy project_insert on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy project_update on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy project_delete on public.projects for delete to authenticated using ((select auth.uid()) = user_id);
create policy document_read on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy document_insert on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy document_update on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy document_delete on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

create function public.new_account() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.accounts(user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;
revoke all on function public.new_account() from public;
create trigger create_account after insert on auth.users for each row execute function public.new_account();
insert into public.accounts(user_id) select id from auth.users on conflict do nothing;

create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke all on function public.touch_updated_at() from public;
create trigger update_project before update on public.projects for each row execute function public.touch_updated_at();
create trigger update_document before update on public.documents for each row execute function public.touch_updated_at();

create function public.invalidate_edited_plan() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.module = 'plan' and old.content is distinct from new.content then
    update public.projects set profile = (profile - 'validatedPlanId') || '{"planValidated":false}'::jsonb
      where id = new.project_id and profile->>'validatedPlanId' = new.id::text;
  end if;
  return new;
end; $$;
revoke all on function public.invalidate_edited_plan() from public;
create trigger invalidate_plan after update on public.documents for each row execute function public.invalidate_edited_plan();

create function public.enforce_project_limit() returns trigger language plpgsql security definer set search_path = '' as $$
declare tier text; cap integer;
begin
  select case when plan <> 'free' and subscription_expires_at > now() then plan else 'free' end
    into tier from public.accounts where user_id = new.user_id for update;
  cap := case tier when 'offre' then 5 when 'max' then 20 else 1 end;
  if (select count(*) from public.projects where user_id = new.user_id) >= cap then
    raise exception 'Limite de projets atteinte pour cette offre.';
  end if;
  return new;
end; $$;
revoke all on function public.enforce_project_limit() from public;
create trigger project_limit before insert on public.projects for each row execute function public.enforce_project_limit();

-- Server-only RPC. The account row serializes reservations across server instances.
create function public.reserve_ai_job(p_user_id uuid, p_project_id uuid, p_module text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare tier text; cap integer; used integer; recent integer; job uuid;
begin
  if not exists (select 1 from public.projects where id = p_project_id and user_id = p_user_id) then
    raise exception 'Projet introuvable';
  end if;
  select case when plan <> 'free' and subscription_expires_at > now() then plan else 'free' end
    into tier from public.accounts where user_id = p_user_id for update;
  if not found then raise exception 'Compte introuvable'; end if;
  cap := case tier when 'offre' then 60 when 'max' then 150 else 3 end;
  select count(*) into recent from public.ai_jobs where user_id = p_user_id and created_at > now() - interval '1 minute';
  if recent >= 3 then return jsonb_build_object('allowed',false,'reason','rate'); end if;
  select count(*) into used from public.ai_jobs where user_id = p_user_id and status <> 'failed'
    and created_at >= date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  if used >= cap then return jsonb_build_object('allowed',false,'reason','quota'); end if;
  insert into public.ai_jobs(user_id,project_id,module) values (p_user_id,p_project_id,p_module) returning id into job;
  return jsonb_build_object('allowed',true,'id',job,'remaining',cap-used-1);
end; $$;
revoke all on function public.reserve_ai_job(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_ai_job(uuid,uuid,text) to service_role;

commit;
