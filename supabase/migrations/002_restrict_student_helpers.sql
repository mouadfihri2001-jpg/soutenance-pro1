begin;

-- Supabase may grant function execution directly to these roles by default.
-- Trigger helpers run through their triggers, not through the public RPC API.
revoke all on function public.student_new_account() from public, anon, authenticated;
revoke all on function public.student_touch_updated_at() from public, anon, authenticated;
revoke all on function public.student_invalidate_edited_plan() from public, anon, authenticated;
revoke all on function public.student_enforce_project_limit() from public, anon, authenticated;

commit;
