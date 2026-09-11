-- Scoped signup protection, applied independently of legacy CRM tables.
-- Request identifiers are keyed hashes; raw email addresses/IPs are not stored.
begin;

create table public.student_signup_limits (
  bucket text primary key,
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
create index student_signup_limits_expiry on public.student_signup_limits(expires_at);
alter table public.student_signup_limits enable row level security;
revoke all on public.student_signup_limits from public, anon, authenticated;
grant select, insert, update, delete on public.student_signup_limits to service_role;

-- SECURITY INVOKER: this RPC uses only the service role's explicit table grants.
create function public.student_reserve_signup(p_ip_hash text, p_email_hash text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  at_time timestamptz := statement_timestamp();
  hour_end timestamptz := (date_trunc('hour', statement_timestamp() at time zone 'UTC') + interval '1 hour') at time zone 'UTC';
  day_end timestamptz := (date_trunc('day', statement_timestamp() at time zone 'UTC') + interval '1 day') at time zone 'UTC';
  hour_label text := floor(extract(epoch from statement_timestamp()) / 3600)::text;
  day_label text := floor(extract(epoch from statement_timestamp()) / 86400)::text;
  counter integer;
  row_key text;
  scope integer;
  cap integer;
  expiry timestamptz;
begin
  if p_ip_hash is null or p_email_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' or p_email_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid signup identifiers';
  end if;
  delete from public.student_signup_limits where expires_at <= at_time;
  -- Keep one lock order across requests. Reject exhausted IP/email buckets before
  -- consuming the shared budget; one blocked sender cannot lock out everyone.
  for scope in 1..4 loop
    case scope
      when 1 then row_key := 'ip-day:' || p_ip_hash || ':' || day_label; cap := 50; expiry := day_end;
      when 2 then row_key := 'ip-hour:' || p_ip_hash || ':' || hour_label; cap := 10; expiry := hour_end;
      when 3 then row_key := 'email-hour:' || p_email_hash || ':' || hour_label; cap := 5; expiry := hour_end;
      when 4 then row_key := 'global:' || hour_label; cap := 100; expiry := hour_end;
    end case;
    insert into public.student_signup_limits(bucket, attempts, expires_at) values (row_key, 1, expiry)
      on conflict (bucket) do update set attempts = least(public.student_signup_limits.attempts + 1, 1000000)
      returning attempts into counter;
    if counter > cap then
      return jsonb_build_object('allowed', false, 'retry_after', greatest(1, ceil(extract(epoch from expiry - at_time))::integer));
    end if;
  end loop;
  return jsonb_build_object('allowed', true);
end;
$$;
revoke all on function public.student_reserve_signup(text,text) from public, anon, authenticated;
grant execute on function public.student_reserve_signup(text,text) to service_role;

commit;
