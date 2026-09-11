-- Project-level estimated AI spend reservations. Independent of user quotas.
-- Estimates are retained after failures; this is not the provider's invoice cap.
begin;

create table public.student_ai_budget (
  bucket text primary key,
  reserved_usd numeric not null default 0 check (reserved_usd >= 0 and reserved_usd <= 10000),
  expires_at timestamptz not null
);
alter table public.student_ai_budget enable row level security;
revoke all on public.student_ai_budget from public, anon, authenticated;
grant select, insert, update on public.student_ai_budget to service_role;

create function public.student_reserve_ai_budget(p_estimated_usd numeric, p_daily_limit numeric, p_monthly_limit numeric) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  utc_time timestamp := statement_timestamp() at time zone 'UTC';
  day_key text := 'day:' || to_char(utc_time, 'YYYY-MM-DD');
  month_key text := 'month:' || to_char(utc_time, 'YYYY-MM');
  day_end timestamptz := (date_trunc('day', utc_time) + interval '1 day') at time zone 'UTC';
  month_end timestamptz := (date_trunc('month', utc_time) + interval '1 month') at time zone 'UTC';
  day_spend numeric;
  month_spend numeric;
begin
  if p_estimated_usd is null or p_estimated_usd <= 0 or p_estimated_usd > 1000
    or p_daily_limit is null or p_daily_limit < 0.01 or p_daily_limit > 1000
    or p_monthly_limit is null or p_monthly_limit < 0.01 or p_monthly_limit > 10000 then
    raise exception 'Invalid AI budget';
  end if;
  -- Same lock order for every request, with both checks and writes in one
  -- transaction. A refused request consumes neither budget bucket.
  insert into public.student_ai_budget(bucket, reserved_usd, expires_at) values (day_key, 0, day_end)
    on conflict (bucket) do nothing;
  select reserved_usd into day_spend from public.student_ai_budget where bucket = day_key for update;
  insert into public.student_ai_budget(bucket, reserved_usd, expires_at) values (month_key, 0, month_end)
    on conflict (bucket) do nothing;
  select reserved_usd into month_spend from public.student_ai_budget where bucket = month_key for update;
  if day_spend + p_estimated_usd > p_daily_limit then
    return jsonb_build_object('allowed', false, 'reason', 'day');
  end if;
  if month_spend + p_estimated_usd > p_monthly_limit then
    return jsonb_build_object('allowed', false, 'reason', 'month');
  end if;
  update public.student_ai_budget set reserved_usd = reserved_usd + p_estimated_usd where bucket in (day_key, month_key);
  return jsonb_build_object('allowed', true);
end;
$$;
revoke all on function public.student_reserve_ai_budget(numeric,numeric,numeric) from public, anon, authenticated;
grant execute on function public.student_reserve_ai_budget(numeric,numeric,numeric) to service_role;

commit;
