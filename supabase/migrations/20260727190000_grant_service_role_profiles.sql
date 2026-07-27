-- Grant service_role required privileges on public.profiles for canonical backend workflows.
--
-- Rationale:
--   * SELECT: Profile lookup during authentication, authorization, and provisioning.
--   * INSERT: Profile creation during client owner / staff onboarding and application approval.
--   * UPDATE: Profile / client relationship updates, role assignments, and activation toggles.
--   * DELETE: Canonical permanent client deletion and profile purging.
--
-- Security Controls:
--   * RLS remains enabled on public.profiles.
--   * anon privileges remain REVOKED (0 privileges).
--   * authenticated privileges remain governed by current RLS policies and grants (SELECT, INSERT, UPDATE).

grant select, insert, update, delete on table public.profiles to service_role;

do $verification$
begin
  if not has_table_privilege('service_role', 'public.profiles', 'INSERT') then
    raise exception 'Verification failed: service_role lacks INSERT privilege on public.profiles';
  end if;

  if not has_table_privilege('service_role', 'public.profiles', 'UPDATE') then
    raise exception 'Verification failed: service_role lacks UPDATE privilege on public.profiles';
  end if;

  if not has_table_privilege('service_role', 'public.profiles', 'DELETE') then
    raise exception 'Verification failed: service_role lacks DELETE privilege on public.profiles';
  end if;

  if has_table_privilege('anon', 'public.profiles', 'INSERT') then
    raise exception 'Security violation: anon must not have INSERT privilege on public.profiles';
  end if;
end
$verification$;
