-- Billing is server-only. Apply before STRIPE_BILLING_ENABLED is enabled.
begin;

alter table public.student_accounts add column subscription_period_start timestamptz;

create table public.student_billing_accounts (
  user_id uuid primary key references public.student_accounts(user_id) on delete cascade,
  livemode boolean not null,
  customer_id text unique check (customer_id ~ '^cus_[A-Za-z0-9]+$'),
  subscription_id text unique check (subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  subscription_status text,
  paid_plan text check (paid_plan in ('offre', 'max')),
  period_start timestamptz,
  paid_until timestamptz,
  invoice_id text,
  attempt_id uuid,
  lock_token uuid,
  lock_until timestamptz,
  updated_at timestamptz not null default now()
);
create table public.student_billing_attempts (
  id uuid primary key,
  user_id uuid not null references public.student_billing_accounts(user_id) on delete cascade,
  livemode boolean not null,
  plan text not null check (plan in ('offre', 'max')),
  session_id text unique check (session_id ~ '^cs_[A-Za-z0-9_]+$'),
  session_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  unique (id, user_id)
);
create index student_billing_attempts_owner on public.student_billing_attempts(user_id);
create table public.student_billing_events (
  event_id text primary key check (event_id ~ '^evt_[A-Za-z0-9]+$'),
  user_id uuid not null references public.student_billing_accounts(user_id) on delete cascade,
  subscription_id text not null,
  processed_at timestamptz not null default now()
);
create index student_billing_events_owner on public.student_billing_events(user_id);

alter table public.student_billing_accounts enable row level security;
alter table public.student_billing_attempts enable row level security;
alter table public.student_billing_events enable row level security;
revoke all on public.student_billing_accounts, public.student_billing_attempts, public.student_billing_events from public, anon, authenticated;
grant select, insert, update, delete on public.student_billing_accounts, public.student_billing_attempts, public.student_billing_events to service_role;

-- Lease plus token fencing serializes Stripe fetches and writes across server
-- instances. A timed-out handler cannot overwrite the successor's fresh state.
create function public.student_billing_lock(p_user_id uuid, p_livemode boolean, p_token uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare a public.student_billing_accounts;
begin
  if p_user_id is null or p_token is null or p_livemode is null then raise exception 'Invalid billing lock'; end if;
  insert into public.student_billing_accounts(user_id, livemode) values (p_user_id, p_livemode) on conflict do nothing;
  select * into a from public.student_billing_accounts where user_id = p_user_id for update;
  if a.livemode is distinct from p_livemode then raise exception 'Billing mode mismatch'; end if;
  if a.lock_until > clock_timestamp() then return jsonb_build_object('acquired', false); end if;
  update public.student_billing_accounts set lock_token = p_token, lock_until = clock_timestamp() + interval '2 minutes'
    where user_id = p_user_id returning * into a;
  return jsonb_build_object('acquired', true, 'account', to_jsonb(a));
end; $$;

create function public.student_billing_release(p_user_id uuid, p_token uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.student_billing_accounts set lock_token = null, lock_until = null where user_id = p_user_id and lock_token = p_token;
  return found;
end; $$;

create function public.student_billing_save(p_user_id uuid, p_token uuid, p_change jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare a public.student_billing_accounts; t public.student_billing_attempts;
  v_kind text := p_change->>'kind'; v_plan text := p_change->>'plan';
  v_subscription text := p_change->>'subscriptionId'; v_status text := p_change->>'status';
  v_start timestamptz; v_end timestamptz; v_event text := p_change->>'eventId';
begin
  select * into a from public.student_billing_accounts where user_id = p_user_id for update;
  if not found or p_token is null or a.lock_token is distinct from p_token or a.lock_until <= clock_timestamp() then raise exception 'Billing lease expired'; end if;
  if jsonb_typeof(p_change) <> 'object' or octet_length(p_change::text) > 5000 then raise exception 'Invalid billing change'; end if;

  if v_kind = 'customer' then
    if coalesce(p_change->>'customerId', '') !~ '^cus_[A-Za-z0-9]+$' or
      (a.customer_id is not null and a.customer_id <> p_change->>'customerId') then raise exception 'Customer binding mismatch'; end if;
    update public.student_billing_accounts set customer_id = p_change->>'customerId', updated_at = now() where user_id = p_user_id returning * into a;

  elsif v_kind = 'attempt' then
    if a.customer_id is null or v_plan is null or v_plan not in ('offre', 'max') then raise exception 'Invalid checkout attempt'; end if;
    if a.attempt_id is not null and exists (select 1 from public.student_billing_attempts where id = a.attempt_id and expires_at > clock_timestamp()) then
      raise exception 'Checkout already pending';
    end if;
    insert into public.student_billing_attempts(id, user_id, livemode, plan)
      values ((p_change->>'attemptId')::uuid, p_user_id, a.livemode, v_plan) returning * into t;
    update public.student_billing_accounts set attempt_id = t.id, updated_at = now() where user_id = p_user_id;
    return to_jsonb(t);

  elsif v_kind = 'session' then
    select * into t from public.student_billing_attempts where id = (p_change->>'attemptId')::uuid and user_id = p_user_id for update;
    if not found or t.livemode <> a.livemode or coalesce(p_change->>'sessionId', '') !~ '^cs_[A-Za-z0-9_]+$' or
      (t.session_id is not null and t.session_id <> p_change->>'sessionId') or
      coalesce(p_change->>'url', '') !~ '^https://checkout[.]stripe[.]com/' then raise exception 'Session binding mismatch'; end if;
    update public.student_billing_attempts set session_id = p_change->>'sessionId', session_url = p_change->>'url' where id = t.id returning * into t;
    return to_jsonb(t);

  elsif v_kind = 'subscription' then
    if v_plan is null or v_plan not in ('offre', 'max') or coalesce(v_subscription, '') !~ '^sub_[A-Za-z0-9]+$' or
      v_status is null or v_status not in ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused', 'trialing') then
      raise exception 'Invalid subscription';
    end if;
    if a.customer_id is null then raise exception 'Customer binding missing'; end if;
    if a.subscription_id is distinct from v_subscription then
      if a.subscription_id is not null and a.subscription_status not in ('canceled', 'incomplete_expired') then raise exception 'Subscription already bound'; end if;
      select * into t from public.student_billing_attempts where id = (p_change->>'attemptId')::uuid and user_id = p_user_id;
      if not found or t.session_id is null or t.livemode <> a.livemode or t.plan <> v_plan then raise exception 'Checkout binding missing'; end if;
      a.paid_until := null; a.period_start := null; a.paid_plan := null; a.invoice_id := null;
    end if;
    if v_event is not null and exists (select 1 from public.student_billing_events where event_id = v_event) then return to_jsonb(a); end if;
    if p_change->>'paidUntil' is not null then
      v_start := (p_change->>'periodStart')::timestamptz; v_end := (p_change->>'paidUntil')::timestamptz;
      if v_status <> 'active' or v_start is null or v_start > clock_timestamp() + interval '1 minute' or v_end <= clock_timestamp() or
        v_end - v_start < interval '27 days' or v_end - v_start > interval '32 days' or
        coalesce(p_change->>'invoiceId', '') !~ '^in_[A-Za-z0-9]+$' then raise exception 'Invalid paid invoice period'; end if;
      -- A duplicate or an older invoice cannot reset the current billing period.
      if a.period_start is null or (v_start >= a.period_start and v_end >= a.paid_until) then
        a.period_start := v_start; a.paid_until := v_end; a.paid_plan := v_plan; a.invoice_id := p_change->>'invoiceId';
      end if;
    end if;
    if v_status not in ('active', 'past_due') or p_change->>'clearPaid' = 'true' then
      a.paid_until := null; a.period_start := null; a.paid_plan := null;
    end if;
    update public.student_billing_accounts set subscription_id = v_subscription, subscription_status = v_status,
      period_start = a.period_start, paid_until = a.paid_until, paid_plan = a.paid_plan, invoice_id = a.invoice_id, updated_at = now()
      where user_id = p_user_id returning * into a;
    update public.student_accounts set
      plan = case when a.paid_until > clock_timestamp() and a.subscription_status in ('active', 'past_due') then a.paid_plan else 'free' end,
      subscription_expires_at = a.paid_until, subscription_period_start = a.period_start
      where user_id = p_user_id;
    if v_event is not null then
      insert into public.student_billing_events(event_id, user_id, subscription_id) values (v_event, p_user_id, v_subscription);
    end if;
  else raise exception 'Unknown billing change';
  end if;
  return to_jsonb(a);
end; $$;

revoke all on function public.student_billing_lock(uuid, boolean, uuid) from public, anon, authenticated;
revoke all on function public.student_billing_release(uuid, uuid) from public, anon, authenticated;
revoke all on function public.student_billing_save(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.student_billing_lock(uuid, boolean, uuid), public.student_billing_release(uuid, uuid), public.student_billing_save(uuid, uuid, jsonb) to service_role;

-- Automated paid subscriptions use the last fully paid invoice period. Free
-- and pre-existing manual accounts retain the established UTC-month behavior.
create or replace function public.student_reserve_ai_job(p_user_id uuid, p_project_id uuid, p_module text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare tier text; cap integer; used integer; recent integer; job uuid; period_start timestamptz;
begin
  if not exists (select 1 from public.student_projects where id = p_project_id and user_id = p_user_id) then raise exception 'Projet introuvable'; end if;
  select case when plan <> 'free' and subscription_expires_at > now() then plan else 'free' end,
    case when plan <> 'free' and subscription_expires_at > now() and subscription_period_start <= now()
      then subscription_period_start else null end
    into tier, period_start from public.student_accounts where user_id = p_user_id for update;
  if not found then raise exception 'Compte introuvable'; end if;
  period_start := coalesce(period_start, date_trunc('month', now() at time zone 'UTC') at time zone 'UTC');
  cap := case tier when 'offre' then 60 when 'max' then 150 else 3 end;
  select count(*) into recent from public.student_ai_jobs where user_id = p_user_id and created_at > now() - interval '1 minute';
  if recent >= 3 then return jsonb_build_object('allowed', false, 'reason', 'rate'); end if;
  select count(*) into used from public.student_ai_jobs where user_id = p_user_id and status <> 'failed' and created_at >= period_start;
  if used >= cap then return jsonb_build_object('allowed', false, 'reason', 'quota'); end if;
  insert into public.student_ai_jobs(user_id, project_id, module) values (p_user_id, p_project_id, p_module) returning id into job;
  return jsonb_build_object('allowed', true, 'id', job, 'remaining', cap - used - 1);
end; $$;
revoke all on function public.student_reserve_ai_job(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.student_reserve_ai_job(uuid, uuid, text) to service_role;

commit;
