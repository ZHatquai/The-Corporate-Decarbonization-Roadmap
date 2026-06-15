# Handoff — Finish the `user_roles` rename in the Emissions Platform

> Paste this into a session on the **Emissions Platform** repo (the
> `the-corporate-emission-platform-ailab` frontend). It completes the rename that
> the Decarbonization Roadmap build started.

## Context

The shared role table was renamed **`ec_user_roles` → `user_roles`** (Decarbonization
Roadmap, migration `0015`) on the shared Supabase project **The Corporate Space**
(`vbtuzjprzusqsxawmgyl`). The DB-side dependents were already updated: the `ec_private`
helper functions, the `handle_new_ec_user` trigger, `ec_link_pending_users`, the RLS
policies, and the `invite-user` Edge Function all reference `user_roles` now.

The Emissions Platform **frontend** still queries the old name `ec_user_roles` by REST,
so after the rename it showed "Access not provisioned" for valid users. A temporary
bridge keeps it working today — migration `0021` created a view:

```sql
CREATE VIEW public.ec_user_roles WITH (security_invoker = true) AS
  SELECT email, user_id, role, plant_id, created_at FROM public.user_roles;
GRANT SELECT ON public.ec_user_roles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ec_user_roles TO authenticated;
```

This task migrates the platform off the old name and removes that bridge
(expand → **migrate** → **contract**).

## 1. Find every reference

```bash
grep -rn "ec_user_roles" src/
```

Expect these spots (names may differ):
- the session/role hook — own-row lookup `from('ec_user_roles').select('role, plant_id').eq('user_id', …)`
- Settings → Users tab — list `from('ec_user_roles').select(...)` and invite `from('ec_user_roles').insert(...)` / update
- any TypeScript types / constants naming the table

Do **not** touch RPC calls, the `ec_private` helpers, or the `invite-user` function — those already use `user_roles`.

## 2. Make the change

- Replace every `.from('ec_user_roles')` with `.from('user_roles')`. Columns are identical
  (`email`, `user_id`, `role`, `plant_id`, `created_at`).
- The role check constraint now also allows **`sourcing_manager`** (a Decarbonization
  Roadmap role). The platform doesn't use it; just make sure any hardcoded role
  enum/validation treats an unknown role as "no Emissions Platform access" rather than
  throwing. RLS already returns zero `ec_`/`tc_` rows for `sourcing_manager`, so no data leaks.

## 3. Verify (on a preview/staging deploy — the bridge view means both names work, so there's no rush)

- esg_admin signs in → full access (no "Access not provisioned").
- plant_manager signs in → own plant only.
- Settings → Users still lists users and can invite (insert reaches `user_roles`).
- The Decarbonization Roadmap is unaffected throughout (it already uses `user_roles`).

## 4. Contract — drop the bridge (ORDER MATTERS)

Only **after** the platform is redeployed on `user_roles` and verified, drop the view
against project `vbtuzjprzusqsxawmgyl` (Supabase SQL editor or MCP):

```sql
DROP VIEW public.ec_user_roles;
```

Do **not** drop it before the platform is migrated, or you reintroduce the outage.

## 5. Post-drop sanity checks

```sql
SELECT to_regclass('public.ec_user_roles');  -- expect NULL (gone)
SELECT to_regclass('public.user_roles');     -- expect user_roles
```

- Re-test platform sign-in (now via `user_roles`).
- `get_advisors(security)` → no new issues.
- Update the Emissions Platform's `docs/supabase-setup.md` to note the rename is complete
  and the compat view removed.

## Rollback

If anything breaks after the drop, recreate the view with the migration-`0021` SQL above
to instantly restore the old-name path, then investigate.
