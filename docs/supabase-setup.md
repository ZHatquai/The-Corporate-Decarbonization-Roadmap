# Supabase Setup — The Corporate Supplier Sustainability Portal 2026

> Schema source of truth. From the moment this file exists it overrides the
> provisional schema in CLAUDE.md. Update it at every save point that touches
> the database (any table, policy, or bucket change).

## Project

| Detail | Value |
|--------|-------|
| Project name | **The Corporate Space** |
| Project ID / ref | `vbtuzjprzusqsxawmgyl` |
| Project URL | `https://vbtuzjprzusqsxawmgyl.supabase.co` |
| Organization | SustainOS - AI Lab (`igorsavpakvljlfkdrje`) |
| Region | `eu-central-1` (EU — Frankfurt; GDPR) |
| Postgres | 17 |
| Plan | Free (pauses after ~1 week idle; manual wake in dashboard if needed) |

> **Deviation from CLAUDE.md, noted:** CLAUDE.md said to *create* the project this
> session. The project "The Corporate Space" already existed (created 2026-06-13,
> empty), in the correct GDPR region, with the exact mandated name — so this build
> used the existing project rather than creating a duplicate. This matches the
> game-plan decision to use an existing project.

## Credentials (never committed)

The frontend uses the **anon key** only, supplied through Netlify env vars
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). The anon key is intentionally
public and browser-safe **only because RLS is insert-only with no read**. It is
never written to any file in the repo. Retrieve it from:
Supabase dashboard → Project Settings → API (anon / public key).
The **service role key** is used only by the EHS team in the dashboard to read
submissions and download CSVs; it never appears in the tool or the repo.

## Tables

### `submissions`
One row per submission, all three routes. Identity + GDPR consent + metadata.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` (client may supply its own UUID) |
| company_name | text | not null |
| contact_name | text | not null |
| contact_email | text | not null |
| route | text | not null, check in (`ecovadis`, `csv_upload`, `fill_here`) |
| consent_given | boolean | not null |
| csv_file_path | text | nullable (set on `csv_upload` route only) |
| created_at | timestamptz | not null, default `now()` |

### `questionnaire_responses`
One row per `fill_here` submission, linked to `submissions`. All ESRS answers optional.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| submission_id | uuid | not null, FK → `submissions(id)` on delete cascade (indexed) |
| e1_scope1_emissions | numeric | Scope 1 emissions, last fiscal year |
| e1_scope2_emissions | numeric | Scope 2 emissions, last fiscal year |
| e1_scope3_emissions | numeric | Scope 3 emissions, last fiscal year |
| e1_decarbonization_roadmap | text | Top three decarbonization projects |
| e1_implementation_barriers | text | Barriers to 50% Scope 1&2 cut by 2030 |
| e2_substances_of_concern_weight | numeric | Total weight of substances of concern |
| e2_pfas_alternative_strategy | text | PFAS substitution roadmap |
| e2_wastewater_management | text | Industrial wastewater treatment process |
| e3_water_stewardship_projects | text | Water-saving / closed-loop projects |
| e3_scarcity_contingency | text | High-water-stress contingency plan |
| e5_design_for_circularity | text | Circularity in supplied components |
| e5_waste_reduction_diversion | text | Zero Waste to Landfill strategy |
| e4_site_impact_mitigation | text | Biodiversity impact mitigation |
| s2_human_rights_policy | text | Yes/No — formal Human Rights policy |
| s2_human_rights_due_diligence | text | Yes/No — due diligence in last 24 months |
| s2_grievance_mechanism | text | Grievance mechanism description |
| g1_conflict_minerals_policy | text | Yes/No — verified 3TG conflict minerals policy |
| g1_supplier_code_of_conduct | text | Supplier code of conduct description |
| created_at | timestamptz | not null, default `now()` |

> Number-typed questions are `numeric`; Yes/No and long-text are `text`. Column
> names match the form's `field.name` exactly, so the insert payload needs no
> mapping layer.

## Row Level Security (RLS)

RLS is **enabled** on both tables. The `anon` role is **insert-only**; there is
no SELECT/UPDATE/DELETE policy, so reads/updates/deletes default-deny. This is
the security boundary that stops the public anon key from reading supplier data.
**Never disable RLS to work around a query failure** — fix the policy or query.

| Table | Policy | Command | Role | Clause |
|-------|--------|---------|------|--------|
| submissions | `submissions_anon_insert` | INSERT | anon | `with check (true)` |
| questionnaire_responses | `questionnaire_responses_anon_insert` | INSERT | anon | `with check (true)` |

**Verified (2026-06-13, session 2):** simulating `role anon` in a rolled-back
transaction, INSERT into both tables succeeded (FK link works without read-back),
and SELECT returned 0 rows on both. Live anon REST read-back test deferred to the
deployed site (outbound HTTP to supabase.co is blocked in the build environment).

## Storage

| Detail | Value |
|--------|-------|
| Bucket | `supplier-csv-uploads` |
| Public? | No (private — not listable or readable without the service role) |
| Policy | `supplier_csv_anon_upload` on `storage.objects`: INSERT for `anon` `with check (bucket_id = 'supplier-csv-uploads')` |

The `anon` role may upload one CSV per submission; it cannot list, read, update,
or delete objects. The EHS team downloads files via the Supabase dashboard.

## Migrations applied (this build)

1. `v2_create_submissions_and_questionnaire_responses` — both tables, FK, index, RLS + anon insert policies.
2. `v2_create_supplier_csv_uploads_bucket` — private bucket + anon insert-only storage policy.

## Security advisor notes (accepted)

- **`rls_policy_always_true` (WARN, ×2)** on the two insert policies — *by design*.
  Suppliers may submit any subset of answers, so the insert check is intentionally
  unrestricted. The boundary is the absence of read/update/delete policies, not the
  insert check.
- **`anon_security_definer_function_executable` (WARN)** on `public.rls_auto_enable()`
  — *pre-existing, benign, not created by this build*. It is an event-trigger
  function (tied to the `ensure_rls` event trigger) that auto-enables RLS on any new
  `public` table — a protective safety net. It is SECURITY DEFINER because event
  triggers require it; invoking it via RPC outside an event-trigger context simply
  errors. Left untouched intentionally.

## Notes for future sessions

- The Free plan pauses after ~1 week idle. If REST calls 5xx after a quiet period,
  wake the project in the Supabase dashboard.
- To process a GDPR deletion request (sent to sustainability@thecorporate.com):
  delete the matching `submissions` row (cascades to `questionnaire_responses`) and
  delete any associated object from the `supplier-csv-uploads` bucket, via the dashboard.
- New tables created later will get RLS auto-enabled by the `ensure_rls` trigger, but
  you must still add explicit policies — auto-enable with no policy = default-deny everything.

---

# Supabase Setup — The Corporate Emissions Platform (added by this build)

> This section documents the **new `tc_`/`ec_` objects** added for the Emissions
> Platform. It is strictly additive. The Supplier Portal's `submissions`,
> `questionnaire_responses`, `supplier-csv-uploads` bucket, `ensure_rls` event
> trigger, and `rls_auto_enable()` function are **not modified**. All migrations
> live in `supabase/migrations/0001`–`0014` (and a paste-ready `supabase/apply_all.sql`).
>
> **Status: APPLIED + VERIFIED to the live project (session 2, 14 June 2026).**
> Migrations 0001–0014 were applied in order via the Supabase MCP `apply_migration`
> (recorded in the migration history). Seed and RLS were verified live (see
> Verification below). Portal objects confirmed unchanged.

## New tables (all RLS-enabled by `ensure_rls`; explicit policies shipped per table)

| Table | Purpose | Key columns / notes |
|-------|---------|---------------------|
| `tc_plants` | Shared plant register (retire-not-delete) | `plant_id` PK, `plant_name`, `country`, `state` Active/Retired |
| `ec_emission_factors` | Factor register per vintage (edit/retire, never delete) | PK `(ef_id, ef_year)`; CHECKs enforce `source not null` and `status='Provisional' ⇒ provisional_rationale not null` |
| `ec_ef_plant_applicability` | Factor→plant mapping; drives the cascade | unique `(ef_id, plant_id, coalesce(ef_year,-1))`; `ef_year` NULL = all vintages |
| `ec_user_roles` | Authorization / invite table | **PK = `email`**, nullable `user_id` (linked on first sign-in), `role`, `plant_id` |
| `ec_submissions` | Submission header + state machine | one current per `(plant_id,year,quarter)` by max `version`; states draft/submitted/approved/rejected |
| `ec_submission_lines` | Line items; snapshot written on approval | `snap_*`, `flag_prior_year`, `emissions_tco2e` |
| `ec_comments` | Immutable comment thread | no update/delete policies |
| `ec_restatements` | Immutable post-approval correction log | no update/delete policies |

## RLS model (no recursion)

A private `ec_private` schema holds four SECURITY DEFINER helpers —
`auth_ec_role()`, `auth_ec_plant_id()`, `auth_ec_is_admin()`,
`auth_ec_manages_plant(text)` — that read `ec_user_roles` as the table owner
(RLS is *enabled, not forced*, so the owner bypasses it). Table policies call
these helpers instead of sub-selecting `ec_user_roles`, which prevents policy
recursion. `anon` has **no policy on any `tc_`/`ec_` table** → zero access. An
authenticated user with no `ec_user_roles` row gets nothing. Managers are scoped
to their own plant; the ESG admin sees all. Per-table read/insert/update/delete
matches spec Section 6; only `ec_ef_plant_applicability` allows admin delete; no
other `tc_`/`ec_` table has any delete policy (registers retire, records persist).

**`ec_submission_lines` policy split (migration 0014).** The manager's line
access separates READ from WRITE per spec Section 6: a manager can **read** every
line of an own-plant submission in **any** state (so the Plant Dashboard can show
approved emissions and the in-review submission is visible), while
**insert/update/delete** are allowed only while the parent submission is
`draft`/`rejected`. Policies: `ec_lines_mgr_read` (select, any state),
`ec_lines_mgr_insert` / `ec_lines_mgr_update` / `ec_lines_mgr_delete`
(draft/rejected only), `ec_lines_admin_read` (admin read-only; the approval
snapshot is written by the `ec_approve_submission` definer RPC). The original
single `ec_lines_mgr_all` FOR-ALL policy was replaced because it gated SELECT on
draft/rejected too, which hid approved lines from the owning manager.

## Functions, trigger, RPCs

- **`public.handle_new_ec_user()`** — SECURITY DEFINER row trigger
  `on_auth_user_created_ec AFTER INSERT ON auth.users`; links a new auth user to a
  pending `ec_user_roles` invite by case-insensitive email. Distinct object/event
  from the protected `ensure_rls` DDL event trigger.
- **`public.ec_link_pending_users()`** — admin-callable backfill for
  invite-after-signup.
- **State-machine RPCs** (SECURITY DEFINER, self-authorizing):
  `ec_submit_submission`, `ec_approve_submission` (resolves + snapshots each line's
  factor for the submission year, computes `emissions_tco2e`, raises on NO_FACTOR),
  `ec_reject_submission` (required comment), `ec_clarify_submission` (no state
  change), `ec_create_resubmission` (new version draft, copies lines),
  `ec_restate_line` (quantity/snap_ef_kgco2e correction → logs `ec_restatements`).

## Auth / invite flow (two layers — important)

Authorization and authentication are separate:

- **Authorization** is the `ec_user_roles` row (email + role + plant). The admin
  Settings → Users tab inserts it via RLS (`inviteUser`), then calls
  `ec_link_pending_users()` (covers the already-signed-up case).
- **Authentication** is the `auth.users` row. It is created when the invitee
  accepts the invite (or first signs in); the `handle_new_ec_user` trigger then
  links it to the pending `ec_user_roles` row by email.

**Invite delivery — `invite-user` edge function.** After inserting the role row,
the Users tab calls the `invite-user` Edge Function (see "Edge Functions" below),
which sends a Supabase Auth invite email automatically. The admin no longer has to
share a link by hand. The login call also sets `shouldCreateUser: true` (the
supabase-js default, made explicit) so self-service first sign-in from
`<site>/login` keeps working as a fallback.

**Required Supabase setting:** Authentication → **Enable Signups must be ON** for a
brand-new invited email to complete its first magic-link sign-in. This does not
weaken invite-only access: a signed-in account with no `ec_user_roles` row gets
zero data (RLS) and lands on the "Access not provisioned" screen. Invite-only is
enforced by the membership table + RLS, not by the signup toggle (spec Section 6).

## Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `invite-user` | Sends a Supabase Auth invite email (`auth.admin.inviteUserByEmail`) when the admin adds a user. | Caller must be `esg_admin` (verified inside the function); deployed with `verify_jwt = true`. |

Notes:
- Source: `supabase/functions/invite-user/index.ts`. The **only** server-side
  component in this build; everything else (reads, export) stays browser-only.
- The **service-role key is injected by Supabase at runtime**
  (`SUPABASE_SERVICE_ROLE_KEY`) — it never appears in the repo, env files, or the
  browser. The function reads the caller's JWT, confirms an `esg_admin` row in
  `ec_user_roles`, then sends the invite. A non-admin caller gets 403.
- The invite email is delivered through the project's configured Auth **SMTP
  (Resend)** — no Resend API code or key lives in the function. It uses the
  "Invite user" email template (Authentication → Email Templates; optional to brand).
- "Already registered" emails are handled gracefully (returns `status: 'exists'`;
  the UI tells the admin the person can sign in at `/login`).
- Deploy with the Supabase CLI (`supabase functions deploy invite-user`), the
  Supabase MCP `deploy_edge_function`, or the dashboard. No DB migration involved.

## Seed + demo data

- `tc_plants`: 5 plants (TC-FAC-001..005), all Active.
- `ec_emission_factors`: 16 factors, vintage 2025, Active. R-22 (`EF-S1-010`) =
  Montreal Protocol; District heating (`EF-S2-DH01`) = Provisional with rationale.
- `ec_ef_plant_applicability`: per spec Section 9 "applies to".
- First ESG admin: pending `ec_user_roles` row for `z.hatquai@gmail.com`
  (links on first magic-link sign-in).
- **Demo dataset** (`0012`): 2025 fully reported (all plants × Q1–Q4 approved) +
  a 2026 mix exercising every Block B status and the prior-year fallback. Remove
  it when real data flows.

## Deviations from the provisional CLAUDE.md schema (noted)

- `ec_user_roles` uses **`email` as PK with a nullable `user_id`** (CLAUDE.md
  implied `user_id` as the identity). This supports invite-before-signup with no
  service-role key in the browser; `user_id` is linked by the auth trigger.
- `ec_emission_factors` PK is **composite `(ef_id, ef_year)`** so a code can carry
  multiple vintages (needed for the prior-year fallback).

## Hardening: function EXECUTE grants (migration 0013)

Postgres grants `EXECUTE` to `PUBLIC` by default, which made the new
`SECURITY DEFINER` functions reachable by `anon` via PostgREST `/rpc` (even though
each RPC self-authorizes internally). Migration 0013 revokes `PUBLIC`/`anon`
execute on all eight new functions and keeps the intended grant to
`authenticated` on the seven app RPCs. `handle_new_ec_user()` is a trigger-only
function and is revoked from everyone (the `AFTER INSERT` trigger on `auth.users`
still fires regardless of EXECUTE grants). The protected portal function
`rls_auto_enable()` is left untouched.

## Security advisor notes (Emissions Platform — accepted)

After applying 0001–0014, `get_advisors(security)` reports, on this build's objects:

- **`authenticated_security_definer_function_executable` (WARN ×7)** on the app
  RPCs (`ec_submit_submission`, `ec_approve_submission`, `ec_reject_submission`,
  `ec_clarify_submission`, `ec_create_resubmission`, `ec_restate_line`,
  `ec_link_pending_users`) — **by design**. These are the standard Supabase
  pattern: privileged cross-table writes exposed as `SECURITY DEFINER` RPCs the
  signed-in user calls; each one self-authorizes with the `ec_private` helpers
  (`auth_ec_is_admin` / `auth_ec_manages_plant`) and raises on an unauthorized
  caller. They must be executable by `authenticated`, so this WARN is expected
  and accepted. The `anon` variant of this lint was eliminated by 0013.

Pre-existing **portal** warnings remain and are not ours to change:
`rls_policy_always_true` (×2, the portal's anon-insert policies) and
`anon_/authenticated_security_definer_function_executable` on
`public.rls_auto_enable()`.

`get_advisors(performance)` shows only INFO/WARN that are normal for a fresh
schema: unused indexes (no traffic yet), unindexed `auth.users` FKs on
audit columns (`created_by`/`decided_by`/`author_id`/`restated_by`), and
multiple-permissive-policies (the deliberate manager+admin policy split per role).
None require action.

## Verification (session 2 — live)

Roles simulated in rolled-back `execute_sql` transactions with
`set local role …; set local request.jwt.claims = '{"sub":"<uuid>"}';`
(the `ec_user_roles.user_id → auth.users` FK was dropped inside the same
rolled-back transaction to allow a synthetic test uuid):

| Scenario | Result |
|----------|--------|
| `anon` | 0 rows on every `tc_`/`ec_` table ✓ |
| authenticated, no `ec_user_roles` row | 0 rows everywhere ✓ |
| `esg_admin` | sees all: 5 plants, 16 factors, 36 applicability, 28 submissions, 143 lines ✓ |
| `plant_manager` (TC-FAC-001) | only own plant: 1 plant, 7 own applicability rows, 7 submissions, 28 own lines (incl. 20 approved); can read all 16 active factors (register, read-only); write to approved lines blocked (0), draft writes allowed (4) ✓ |

Seed/demo verified: 5 plants (Active), 16 factors (2025, none missing a source),
R-22 `EF-S1-010` = Montreal Protocol, `EF-S2-DH01` = Provisional w/ rationale,
pending `esg_admin` invite for `z.hatquai@gmail.com` (links on first sign-in),
2025 fully approved for all plants × Q1–Q4, 2026 mix (5 approved/1 submitted/1
rejected-with-comment/1 draft). Calc check: `emissions_tco2e = quantity ×
snap_ef_kgco2e ÷ 1000` exact (max abs error 0); 2026 approved lines fall back to
2025 with the PRIOR-YEAR flag; snapshot integrity (every approved line snapped,
no non-approved line snapped).

---
_Last updated: 14 June 2026 — session 2 (Emissions Platform DB **applied + verified**: 8 tc_/ec_ tables, RLS helpers, auth-link trigger, state-machine RPCs, seed + demo data; migration 0013 hardened function grants; migration 0014 fixed the manager line-read policy). Portal schema above unchanged._

---

# Supabase Setup — The Corporate Decarbonization Roadmap (added by this build)

> Strictly additive on top of the Supplier Portal and Emissions Platform, **plus
> one sanctioned change to a shared object**: `ec_user_roles` was renamed to
> `user_roles` (it is now shared by the Emissions Platform and this tool). Helper
> names and the `ec_private` schema are unchanged. Nothing else existing was
> modified. Migrations `0015`–`0019`.
>
> **Status: APPLIED + VERIFIED to the live project (session 2, 15 June 2026).**

## Shared-table rename: `ec_user_roles` → `user_roles` (migration 0015, atomic)

One atomic migration, applied before any `dr_` table:

1. `ALTER TABLE ec_user_roles RENAME TO user_roles;` (PK `email`, nullable `user_id`,
   `role`, `plant_id` — structure unchanged; the FK to `auth.users` follows the rename).
2. Role check constraint expanded: dropped `ec_user_roles_role_check`, added
   `user_roles_role_check CHECK (role IN ('plant_manager','esg_admin','sourcing_manager'))`.
   `sourcing_manager` is new this build.
3. `CREATE OR REPLACE` of all six dependent objects to reference `public.user_roles`
   (names/schema unchanged): the four `ec_private` helpers (`auth_ec_role`,
   `auth_ec_plant_id`, `auth_ec_is_admin`, `auth_ec_manages_plant`), the auth-link
   trigger function `handle_new_ec_user`, and the backfill `ec_link_pending_users`.
   The plpgsql functions (`handle_new_ec_user`, `ec_link_pending_users`) reference the
   table by name at runtime and **had** to be recreated; the SQL helpers were recreated
   for source-text correctness.
4. The `invite-user` Edge Function was redeployed (version 2, `verify_jwt = true`) with
   its single `.from('ec_user_roles')` changed to `.from('user_roles')`.

**Verification (rolled-back role simulations, session 2):** after the rename the
Emissions Platform is unaffected — `anon` and a no-role authenticated user see 0 rows on
every `tc_`/`ec_` table; `esg_admin` sees all (5 plants, 48 factors, 61 submissions, 420
lines, 4 role rows); `plant_manager` (TC-FAC-001) sees only its own plant (1 plant, 12 own
submissions, 84 own lines, 0 other-plant); a `sourcing_manager` sees **0** rows on every
`tc_`/`ec_` table (emissions isolation confirmed — the platform helpers naturally return
false for the new role). Satisfies acceptance criteria 1, 2, and the `sourcing_manager`
half of 6.

## New `dr_` tables (RLS auto-enabled by `ensure_rls`; explicit policies shipped)

### `dr_projects` (migration 0016)
One row per decarbonization project, plant or global.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | `gen_random_uuid()` |
| project_code | text NOT NULL UNIQUE | assigned by trigger `dr_assign_project_code`: `DC-` + 3-digit zero-padded `dr_project_code_seq` (e.g. `DC-001`); widens past 999 naturally |
| plant_id | text NULL → `tc_plants(plant_id)` | **NULL = corporate/global** |
| area | text NOT NULL | CHECK in (Energy efficiency, Electrification, Renewables, Materials, Logistics, Suppliers, Removals, Grid) |
| scope | text NOT NULL | CHECK in ('1','2','1 & 2','3') |
| name | text NOT NULL | |
| description | text NOT NULL | |
| abatement_tco2e | numeric NOT NULL | annual abatement, tCO2e/yr |
| start_year | integer NOT NULL | |
| is_removal | boolean NOT NULL | default false |
| capex_usd | numeric NOT NULL | |
| opex_annual_usd | numeric NOT NULL | |
| mac_usd_per_tco2e | numeric NOT NULL | entered, may be negative (cost-saving) |
| status | text NOT NULL | default `'evaluation'`; CHECK in (evaluation, pending, approved, restudy). **Set only by the workflow functions** |
| submitted_by | uuid NULL → `auth.users(id)` ON DELETE SET NULL | default `auth.uid()` (nullable to mirror the platform's `created_by` and allow auth-user deletion) |
| created_at | timestamptz NOT NULL | default `now()` |
| updated_at | timestamptz NOT NULL | default `now()`; maintained by `dr_set_updated_at` BEFORE UPDATE trigger |

Indexes: `dr_projects_plant_id_idx (plant_id)`, `dr_projects_status_idx (status)`, unique on `project_code`.

### `dr_annual_inventory` (migration 0016)
One frozen row per reporting year. `esg_admin`-only.

| Column | Type | Notes |
|--------|------|-------|
| year | integer PK | |
| scope1_tco2e | numeric NOT NULL | location-based |
| scope2_tco2e | numeric NOT NULL | location-based (only basis today) |
| scope3_tco2e | numeric NOT NULL | entered by ESG lead |
| total_tco2e | numeric NOT NULL | `= scope1 + scope2 + scope3`, computed on publish |
| status | text NOT NULL | CHECK in (base_year, reported); 2023 = base_year, else reported |
| published_at | timestamptz NOT NULL | default `now()` |
| updated_at | timestamptz NOT NULL | default `now()`; `dr_set_updated_at` trigger |

### `dr_comments` (migration 0016)
Immutable return-comment trail. Inserts only via `dr_return_project`; no update/delete policies.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | `gen_random_uuid()` |
| project_id | uuid NOT NULL → `dr_projects(id)` ON DELETE CASCADE | indexed (`dr_comments_project_id_idx`) |
| author | uuid NULL → `auth.users(id)` ON DELETE SET NULL | default `auth.uid()` (the ESG lead) |
| comment | text NOT NULL | |
| from_status | text NOT NULL | CHECK in (evaluation, pending) — the status returned from |
| created_at | timestamptz NOT NULL | default `now()` |

## RLS policies (all `TO authenticated`; reuse `ec_private` helpers + `sourcing_manager` handling)

| Table | Policy | Cmd | Clause |
|-------|--------|-----|--------|
| dr_projects | dr_projects_pm_read | SELECT | `auth_ec_manages_plant(plant_id)` |
| dr_projects | dr_projects_sm_read | SELECT | `auth_ec_role()='sourcing_manager' AND plant_id IS NULL` |
| dr_projects | dr_projects_admin_read | SELECT | `auth_ec_is_admin()` |
| dr_projects | dr_projects_pm_insert | INSERT | check: `auth_ec_manages_plant(plant_id) AND status='evaluation' AND submitted_by=auth.uid()` |
| dr_projects | dr_projects_sm_insert | INSERT | check: `auth_ec_role()='sourcing_manager' AND plant_id IS NULL AND status='evaluation' AND submitted_by=auth.uid()` |
| dr_projects | dr_projects_pm_update | UPDATE | using+check: `auth_ec_manages_plant(plant_id) AND status='restudy'` (can revise fields but cannot change status) |
| dr_projects | dr_projects_sm_update | UPDATE | using+check: `auth_ec_role()='sourcing_manager' AND plant_id IS NULL AND status='restudy'` |
| dr_annual_inventory | dr_inv_admin_read / _insert / _update | SELECT/INSERT/UPDATE | `auth_ec_is_admin()` |
| dr_comments | dr_comments_pm_read | SELECT | EXISTS project p where `p.id=project_id AND auth_ec_manages_plant(p.plant_id)` |
| dr_comments | dr_comments_sm_read | SELECT | EXISTS project p where `p.id=project_id AND p.plant_id IS NULL AND auth_ec_role()='sourcing_manager'` |
| dr_comments | dr_comments_admin_read | SELECT | `auth_ec_is_admin()` |

`esg_admin` has **no** direct insert/update on `dr_projects` (all transitions via functions);
`dr_comments` has **no** insert/update/delete policy (the return function, owner-privileged,
writes the single row); `anon`/no-role have no policy on any `dr_` table → default-deny.

## Functions (migration 0017; SECURITY DEFINER, self-authorizing, `search_path` pinned)

Workflow (status is set **only** here):
- `dr_advance_project(uuid)` — esg_admin; evaluation → pending.
- `dr_approve_project(uuid)` — esg_admin; pending → approved.
- `dr_return_project(uuid, text)` — esg_admin; evaluation|pending → restudy; raises if comment empty/blank; writes one `dr_comments` row with `from_status`.
- `dr_resubmit_project(uuid)` — owner (plant_manager of the plant, or sourcing_manager for a global project); restudy → evaluation.
- `dr_publish_inventory(integer, numeric)` — esg_admin; aggregates approved location-based S1/S2 for the year (via the `EF-S1-`/`EF-S2-` prefix on `ec_submission_lines.snap_ef_id`), adds the entered Scope 3, computes the total, upserts the frozen row (`base_year` for 2023 else `reported`; re-publish overwrites). Returns the row.

Read-only aggregation (esg_admin):
- `dr_preview_inventory(integer)` → `(scope1_tco2e, scope2_tco2e)` for the publish preview.
- `dr_plant_scope_totals(integer)` → `(plant_id, plant_name, scope1_tco2e, scope2_tco2e)` per plant (LEFT JOIN, so plants with no approved data show 0) for the Emissions & projects view.

**Scope 1 vs 2 derivation (resolved open question):** an approved `ec_submission_lines` row
carries the snapshot factor code `snap_ef_id`, whose `EF-S1-`/`EF-S2-` prefix matches the
authoritative `ec_emission_factors.scope` exactly (verified live: 30 `EF-S1-` = Scope 1, 18
`EF-S2-` = Scope 2). The functions use the prefix on the snapshot — no join, no drop risk —
kept server-side so the publish preview and the per-plant view always agree.

EXECUTE hardening (migration 0017, mirrors 0013): the seven app functions are
`REVOKE`d from `PUBLIC`/`anon` and `GRANT`ed to `authenticated`. The two trigger functions
(`dr_set_updated_at`, `dr_assign_project_code`) are revoked from everyone (triggers fire
regardless). Migration 0019 pinned `search_path` on both trigger functions (clears the
`function_search_path_mutable` lint).

## Seed (migration 0018)

`dr_annual_inventory` seeded for 2023 (`base_year`), 2024, 2025 (`reported`). Scope 1/2 are
aggregated from the platform's **live approved** location-based lines (same logic as
`dr_publish_inventory`, so the seed equals what a re-publish would produce); Scope 3 is the
plug that makes the total match the authoritative chart-spec actuals.

| Year | scope1 | scope2 | scope3 (plug) | total | status |
|------|-------:|-------:|--------------:|------:|--------|
| 2023 | 70,080.06 | 130,580.00 | 489,339.94 | **690,000** | base_year |
| 2024 | 69,377.57 | 129,274.20 | 484,348.23 | **683,000** | reported |
| 2025 | 68,325.96 | 127,315.50 | 477,358.54 | **673,000** | reported |

(Chart-spec baseline 690,000 = 2023 Scope 1+2+3; YoY actuals 683,000 / 673,000.)

## Functional verification (session 2 — rolled-back transactions)

- **State machine + comment trail:** plant_manager submits (`DC-001`, evaluation) → admin
  advance (pending) → admin return with comment (restudy; one `dr_comments` row,
  `from_status='pending'`, comment trimmed) → owner resubmit (evaluation) → admin advance →
  admin approve (approved). Full cycle ✓.
- **dr_projects read scoping:** with P1 (FAC-001), P2 (FAC-002), G1 (global) present —
  plant_manager FAC-001 sees only P1; FAC-002 sees only P2; sourcing_manager sees only G1;
  esg_admin sees all three ✓ (acceptance criterion 6).
- **Guards (all raised as expected):** empty/blank return comment rejected; a manager
  cannot change status by direct UPDATE (RLS); a manager cannot call `dr_advance_project`
  (not authorized); a manager cannot insert for a plant they don't manage (RLS); a non-admin
  cannot call the aggregation functions (not authorized).
- **Aggregations:** `dr_plant_scope_totals(2025)` per-plant S1/S2 sums to 68,326.0 / 127,315.5
  (matches the 2025 inventory) ✓.
- No test rows persisted (all rolled back); `dr_project_code_seq` reset so the first real
  project is `DC-001`.

## Security advisor notes (Decarbonization Roadmap — accepted)

`get_advisors(security)` after 0015–0019 reports, on this build's objects, only
**`authenticated_security_definer_function_executable` (WARN ×7)** on the seven `dr_` app
functions — **by design**, identical to the platform's accepted stance for its `ec_` RPCs
(each self-authorizes with the `ec_private` helpers and must be callable by `authenticated`).
The earlier `function_search_path_mutable` warnings on the two trigger functions were fixed
in 0019. All other findings are pre-existing portal/platform items not owned by this build
(`rls_policy_always_true` ×2, `rls_auto_enable`, the eight `ec_` RPC warnings, and the
project-level `auth_leaked_password_protection` auth setting).

## Demo project pipeline (migration 0020 — builder-provided, removable)

`dr_projects` seeded with 39 demo projects across the 5 plants + global (codes
`DC-001`–`DC-039`): 14 approved, 19 pending, 3 evaluation, 3 restudy (one removal —
DAC, `DC-039`). Three restudy projects carry a seeded `dr_comments` return note
(author NULL). Designed to reconcile the roadmap: approved+pending non-removal
reductions 740,200, removals 73,075, grown carbon debt ≈ 813,280 → **net ≈ 5 tCO2e
(Net-Zero), removals 8.99% (within the 10% SBTi cap)**. The `dr_project_code_seq`
was advanced to 39 so live submissions continue at `DC-040`. Remove with:
`DELETE FROM public.dr_projects WHERE submitted_by IS NULL AND project_code BETWEEN 'DC-001' AND 'DC-039';`

## Backward-compatibility view `ec_user_roles` (migration 0021)

The rename in 0015 broke the **Emissions Platform** frontend, whose deployed bundle
still queries the pre-rename name `ec_user_roles` by REST (own-row role lookup) — its
sign-in showed "Access not provisioned" even for valid roles. Migration 0021 restores
that name as a view (the "expand" half of an expand→migrate→contract rename):

```sql
CREATE VIEW public.ec_user_roles WITH (security_invoker = true) AS
  SELECT email, user_id, role, plant_id, created_at FROM public.user_roles;
GRANT SELECT ON public.ec_user_roles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ec_user_roles TO authenticated;
```

`security_invoker = true` means the underlying `user_roles` RLS is enforced with the
caller's identity, so the view exposes nothing new (verified: esg_admin → all rows,
plant_manager → own row only, anon → 0). The view is auto-updatable, so the platform's
invite insert/update still flows through to `user_roles` under RLS. `get_advisors(security)`
reports no new lint (no `security_definer_view` because invoker mode is set).

This is a **bridge**: when the Emissions Platform is migrated to query `user_roles`
directly and redeployed, drop the view (`DROP VIEW public.ec_user_roles;`) to finish the
rename. The Roadmap already uses `user_roles` directly and does not need it.

---
_Last updated: 15 June 2026 — session 2 (Decarbonization Roadmap DB **applied + verified**: ec_user_roles → user_roles rename + sourcing_manager role, invite-user redeployed, three dr_ tables + RLS, five workflow + two aggregation functions, 2023–2025 inventory seed, a removable 39-row demo project pipeline, and the ec_user_roles compatibility view for the Emissions Platform; migrations 0015–0021). Supplier Portal and Emissions Platform schemas above unchanged except the sanctioned rename._
