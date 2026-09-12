-- Temporary owner-issued access grants. A pass is not evidence of payment.
-- Seed only token hashes through a server-side administrative operation.
begin;

create table public.student_access_campaigns (
  id text primary key check (id ~ '^[a-z][a-z0-9_-]{2,79}$'),
  enabled boolean not null default true,
  redeem_until timestamptz not null,
  created_at timestamptz not null default now()
);
create table public.student_access_passes (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.student_access_campaigns(id),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  plan text not null check (plan in ('offre', 'max')),
  grant_days integer not null default 30 check (grant_days = 30),
  max_redemptions integer not null default 100 check (max_redemptions between 1 and 100),
  redemption_count integer not null default 0 check (redemption_count between 0 and max_redemptions),
  created_at timestamptz not null default now(),
  unique (campaign_id, plan)
);
create table public.student_access_redemptions (
  user_id uuid not null references public.student_accounts(user_id) on delete cascade,
  campaign_id text not null references public.student_access_campaigns(id),
  pass_id uuid not null references public.student_access_passes(id),
  plan text not null check (plan in ('offre', 'max')),
  starts_at timestamptz not null,
  expires_at timestamptz not null check (expires_at = starts_at + interval '720 hours'),
  primary key (user_id, campaign_id)
);
create index student_access_redemptions_campaign on public.student_access_redemptions(campaign_id);
create index student_access_redemptions_pass on public.student_access_redemptions(pass_id);

alter table public.student_access_campaigns enable row level security;
alter table public.student_access_passes enable row level security;
alter table public.student_access_redemptions enable row level security;
revoke all on public.student_access_campaigns, public.student_access_passes, public.student_access_redemptions from public, anon, authenticated;
grant select, insert, update, delete on public.student_access_campaigns, public.student_access_passes, public.student_access_redemptions to service_role;

-- The verified server-authenticated user and SHA-256 digest are the only inputs.
-- Campaign, tier, limits, duration and expiration all come from private rows.
-- Account + campaign locks make refreshes, concurrent requests and cross-tier
-- attempts use a single original grant. Stripe's row is locked first whenever
-- it exists, matching the billing transaction's billing -> account lock order.
create function public.student_redeem_access_pass(p_user_id uuid, p_token_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  p public.student_access_passes;
  c public.student_access_campaigns;
  a public.student_accounts;
  r public.student_access_redemptions;
  v_subscription_id text;
  v_now timestamptz;
begin
  if p_user_id is null or coalesce(p_token_hash, '') !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'unavailable');
  end if;

  select * into p from public.student_access_passes where token_hash = p_token_hash;
  if not found then return jsonb_build_object('status', 'unavailable'); end if;
  select * into c from public.student_access_campaigns where id = p.campaign_id for update;
  if not found then return jsonb_build_object('status', 'unavailable'); end if;
  -- Re-read after locking: an administrator may have rotated or revoked a pass.
  select * into p from public.student_access_passes where token_hash = p_token_hash for update;
  if not found or p.campaign_id <> c.id then return jsonb_build_object('status', 'unavailable'); end if;

  select subscription_id into v_subscription_id from public.student_billing_accounts where user_id = p_user_id for update;
  select * into a from public.student_accounts where user_id = p_user_id for update;
  if not found then return jsonb_build_object('status', 'account_missing'); end if;
  v_now := clock_timestamp();

  select * into r from public.student_access_redemptions where user_id = p_user_id and campaign_id = c.id;
  if found then
    return jsonb_build_object('status', 'already_used', 'plan', r.plan,
      'startsAt', r.starts_at, 'expiresAt', r.expires_at,
      'active', coalesce(r.expires_at > v_now and a.plan = r.plan and
        a.subscription_period_start = r.starts_at and a.subscription_expires_at = r.expires_at and v_subscription_id is null, false));
  end if;
  if not c.enabled or c.redeem_until <= v_now or p.redemption_count >= p.max_redemptions then
    return jsonb_build_object('status', 'unavailable');
  end if;
  -- Re-check for a billing row created between the first lookup and account lock.
  -- A subsequently confirmed Stripe payment retains precedence over this grant.
  if v_subscription_id is not null or exists (
    select 1 from public.student_billing_accounts where user_id = p_user_id and subscription_id is not null
  ) or (a.plan <> 'free' and a.subscription_expires_at > v_now) then
    return jsonb_build_object('status', 'existing_subscription');
  end if;

  insert into public.student_access_redemptions(user_id, campaign_id, pass_id, plan, starts_at, expires_at)
    values (p_user_id, c.id, p.id, p.plan, v_now, v_now + interval '720 hours') returning * into r;
  update public.student_accounts set plan = r.plan,
    subscription_period_start = r.starts_at, subscription_expires_at = r.expires_at where user_id = p_user_id;
  update public.student_access_passes set redemption_count = redemption_count + 1 where id = p.id;
  return jsonb_build_object('status', 'activated', 'plan', r.plan,
    'startsAt', r.starts_at, 'expiresAt', r.expires_at, 'active', true);
end; $$;

revoke all on function public.student_redeem_access_pass(uuid, text) from public, anon, authenticated;
grant execute on function public.student_redeem_access_pass(uuid, text) to service_role;

commit;
