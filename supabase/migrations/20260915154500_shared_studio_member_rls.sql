-- Keep Film Studio aligned with the canonical shared ParkKey Supabase backend.
-- Approved ParkKey team members must be able to use Studio with their normal
-- authenticated session; service_role remains available for server-side jobs.
-- This migration is intentionally idempotent and safe if some optional tables
-- are not present yet.

create or replace function public.is_approved_parkkey_member()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  approved boolean := false;
begin
  if to_regclass('public.team_members') is null then
    return false;
  end if;

  execute $sql$
    select exists (
      select 1
      from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'approved'
    )
  $sql$ into approved;

  return coalesce(approved, false);
end;
$$;

revoke all on function public.is_approved_parkkey_member() from public;
grant execute on function public.is_approved_parkkey_member() to authenticated, service_role;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'film_projects','film_versions','prompts','prompt_templates','assets','renders',
    'qa_checklists','tags','integrations','media_assets','media_versions',
    'customer_material_links','coreos_material_links','social_posts',
    'social_post_assets','social_schedules','publish_attempts',
    'integration_connections','audit_events','linkedin_sync_runs',
    'linkedin_post_observations','linkedin_weekly_analytics'
  ] loop
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);

    policy_name := 'approved ParkKey members manage ' || table_name;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_approved_parkkey_member()) with check (public.is_approved_parkkey_member())',
        policy_name,
        table_name
      );
    end if;
  end loop;
end $$;

-- The LinkedIn helper views must obey the caller's RLS context when they exist.
do $$
begin
  if to_regclass('public.linkedin_latest_post_state') is not null then
    execute 'alter view public.linkedin_latest_post_state set (security_invoker = true)';
    grant select on public.linkedin_latest_post_state to authenticated, service_role;
  end if;

  if to_regclass('public.linkedin_post_history') is not null then
    execute 'alter view public.linkedin_post_history set (security_invoker = true)';
    grant select on public.linkedin_post_history to authenticated, service_role;
  end if;
end $$;
