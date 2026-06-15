# The Corporate Decarbonization Roadmap

## Identity
A live, role-based decarbonization roadmap for The Corporate (a five-plant manufacturer): the ESG lead reviews live charts, a financial/MAC analysis view, and the full project pipeline; plant and sourcing managers submit decarbonization projects and track their approval status. All users are invited internal employees who sign in by magic link.
Tier: 3 — invited users sign in and different roles see different data, persisted to Supabase with RLS enforcing per-role access (D3+A3).
Spec version governed: v1.0 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone — added to the existing Supabase project "The Corporate Space", shared with the Supplier Portal and the Emissions Platform; this tool builds on the existing schema.

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line above, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, policy, function, or auth change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md, supabase-setup.md, waterfall-chart-spec.md, and yoy-trajectory-chart-spec.md into it.
2. Install the brand skill: create .claude/skills/the-corporate-brand/ and place the provided brand file there as SKILL.md.
3. Announce what moved, then commit and push before building anything.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3–5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · Netlify · Supabase
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is not active — the builder connects the repo and enters environment variables in the Netlify dashboard; remind them before the first deploy.

## Environment Variables
VITE_SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
VITE_SUPABASE_ANON_KEY — Supabase: Project Settings → API → anon / public key — Netlify env var
The frontend uses the anon key only; RLS enforces all access. The existing invite-user Edge Function reads its service role key from the Supabase runtime (SUPABASE_SERVICE_ROLE_KEY), never from Netlify and never from the repo. No value ever appears in code or any committed file; confirm the two VITE_ variables exist before the first deploy.

## Supabase
Project: "The Corporate Space" — already exists. URL: https://vbtuzjprzusqsxawmgyl.supabase.co
docs/supabase-setup.md is the schema source of truth: read it before any database work, never recreate existing tables or policies, and update it at every save point that touches the database. Full field lists and per-role RLS clauses live in docs/product-spec.md (Data Architecture, Access and Permissions).
Plan: Free — pauses after ~1 week without traffic; wake it in the Supabase dashboard if REST calls fail after a quiet period.

Auth: magic link, invite-only — reuses the project's existing auth exactly as the Emissions Platform uses it. Authentication → Enable Signups stays ON (invite-only is enforced by the membership table and RLS, not the signup toggle).
Roles: esg_admin, plant_manager, sourcing_manager — stored in user_roles (renamed from ec_user_roles); sourcing_manager is new this build.

Required FIRST migration — one atomic migration, before any dr_ table:
1. Rename ec_user_roles → user_roles.
2. CREATE OR REPLACE every dependent object to reference the new name: the four ec_private helpers (auth_ec_role, auth_ec_plant_id, auth_ec_is_admin, auth_ec_manages_plant), the auth-link trigger handle_new_ec_user, and the backfill ec_link_pending_users.
3. Expand the role check constraint to add 'sourcing_manager' (keep 'esg_admin' and 'plant_manager').
4. Redeploy the invite-user Edge Function against the new table name.
5. Re-run the Emissions Platform verification matrix (spec Section 5: anon sees nothing, no-role sees nothing, esg_admin sees all, plant_manager sees only their plant). Build nothing else until it passes.
Only the table is renamed; ec_private helper names and the schema stay as they are.

Existing tables this tool reads (SELECT only — no schema or RLS changes):
- ec_submissions, ec_submission_lines — aggregate approved lines for annual and per-plant Scope 1 and 2. Scope 1 vs 2 comes from each line's emission factor (EF-S1-/EF-S2- code prefix); confirm the exact mechanism against the live schema before building the aggregation.
- tc_plants — plant names and the active plant list.
- user_roles — role resolution via the ec_private helpers.

New tables to create (RLS auto-enabled by the ensure_rls trigger, so ship explicit policies for each — auto-enable with no policy is default-deny), then document in docs/supabase-setup.md:
- dr_projects — one row per project, plant or global. status defaults to 'evaluation'; plant_id nullable (NULL = global).
- dr_annual_inventory — one frozen row per reporting year. year is the PK; status is base_year or reported.
- dr_comments — immutable return-comment trail per project (no update or delete).

RLS — build these, reusing the ec_private helpers and adding sourcing_manager handling:
- dr_projects — plant_manager: own plant only (insert in 'evaluation' with plant_id forced to their plant; update only while status = 'restudy'). sourcing_manager: same for global (plant_id NULL). esg_admin: read all, no direct insert or update. anon and no-role: nothing.
- dr_annual_inventory — esg_admin only (read, insert, update); all others nothing.
- dr_comments — plant_manager reads comments on own-plant projects, sourcing_manager reads comments on global projects, esg_admin reads all; inserts only via dr_return_project.

Workflow functions — SECURITY DEFINER, self-authorizing (build like the platform's ec_ RPCs; GRANT EXECUTE to authenticated, REVOKE from anon and PUBLIC per migration 0013). Status is set ONLY by these, never by a direct table edit:
- dr_advance_project(project_id) — esg_admin: evaluation → pending.
- dr_approve_project(project_id) — esg_admin: pending → approved.
- dr_return_project(project_id, comment) — esg_admin: evaluation or pending → restudy; comment required (raise if empty); writes one dr_comments row with from_status.
- dr_resubmit_project(project_id) — owner only (plant_manager own-plant, sourcing_manager own global): restudy → evaluation.
- dr_publish_inventory(year, scope3_tco2e) — esg_admin: read the platform's approved location-based Scope 1 and 2 for the year, add the entered Scope 3, compute the total, upsert the frozen dr_annual_inventory row (base_year for 2023, reported otherwise; re-publish overwrites).
Seed dr_annual_inventory for 2023 (base_year), 2024, and 2025.

## Hard Rules
- API keys never in any frontend file or GitHub commit; always used through a server-side function. Storage follows function placement: Netlify env vars for the frontend, Supabase Edge Function secrets for Edge Functions — Edge Functions cannot read Netlify env vars.
- Netlify Identity: never. Supabase Auth is the only authentication system in this stack.
- RLS: never disabled on any table. If a query fails, fix the policy or the query — never disable RLS to work around it.
- Supabase service role key is used only by the existing invite-user Edge Function (it calls auth.admin to send invites) and is injected by Supabase at runtime as SUPABASE_SERVICE_ROLE_KEY. It bypasses all RLS, never appears in the repo, env files, or the browser, and the frontend never uses it.
- Shared project: this tool shares "The Corporate Space" with the Supplier Portal and the Emissions Platform. Do not modify, drop, or recreate any existing object beyond the one sanctioned ec_user_roles → user_roles rename and its dependent-object updates. Untouchable: the Supplier Portal (submissions, questionnaire_responses, the supplier-csv-uploads bucket, ensure_rls, rls_auto_enable) and the Emissions Platform tables (tc_plants, ec_emission_factors, ec_ef_plant_applicability, ec_submissions, ec_submission_lines, ec_comments, ec_restatements). The three read tables get SELECT only.

## Brand
Brand is governed by the the-corporate-brand skill at .claude/skills/the-corporate-brand/SKILL.md (installed in First Session Setup). Invoke it for any UI, chart, or visual work; apply its chart-colour roles to the waterfall and trajectory consistent with the two chart specs.
Hard rules that hold even if the skill is not loaded:
- Background: Chalk #F2F2F2 page, Linen #EAE4D5 surfaces — never pure white as the default, never Tailwind gray defaults.
- Accent: Acid Lime #C8F135 — highlight only, max two per page, and only inside a black (#000000) container; never a direct fill on light backgrounds and never on body text, nav, borders, or icons. Primary contrast is Ink #000000 on Chalk; links are underlined Ink, never blue.
- Font: Playfair Display for display headings only; DM Sans (300 for body) everywhere else.
- Square corners (border-radius: 0) on buttons, cards, and inputs; no gradients, no drop shadows — use 0.5px hairline borders for depth.

## Business Rules
- Project status starts at 'evaluation' on insert and changes only through the workflow functions above — never by a direct table edit.
- Both charts use only 'approved' (committed) and 'pending' (potential) projects; 'evaluation' and 'restudy' never appear, and both charts follow docs/waterfall-chart-spec.md and docs/yoy-trajectory-chart-spec.md exactly — the only change from those specs is the data source (live tables, not static config). Both charts share one engine.
- Annual inventory total = scope1_tco2e + scope2_tco2e + scope3_tco2e, computed on publish; 2023 is base_year, every other published year is reported; re-publish overwrites (restatement).
- Fixed configuration this build (not user-editable): BAU growth 0.0075/yr, target year 2045, SBTi removal cap 0.10 (breach shows the SBTi badge warning but does not block the chart), net-zero threshold 1000 tCO2e (net at or below reads "Net-Zero").
- MAC curve plots approved + pending by default: bar width = abatement_tco2e, height = mac_usd_per_tco2e, ordered ascending by MAC (negative values first).
- project_code is system-assigned, sequential, and human-readable (e.g. DC-040); plant_id is set from the submitter's role (own plant, or NULL for a sourcing manager), never chosen on the form.

Out of scope — do not build:
- Email notifications on submit, return, or approval (the auth invite email is unaffected — it reuses the existing invite-user function).
- Market-based Scope 2 (location-based only this build; the inventory leaves room to add a market-based column later).
- Any CSV or PDF export of the project list, MAC data, or roadmap.
- ESG-lead-editable trajectory parameters (fixed configuration this build).
- Direct project creation by the ESG lead (creation is by plant and sourcing managers only).
- A separate "submit to management" role or true escalation step (the ESG lead is both evaluator and approver this build).

## Reference Docs
Read before building the related part:
- docs/product-spec.md — full module specs, UI sections, logic, data architecture, access rules.
- docs/supabase-setup.md — schema source of truth (exists — read first, before any database work).
- docs/waterfall-chart-spec.md — authoritative waterfall chart definition (math, visuals, acceptance).
- docs/yoy-trajectory-chart-spec.md — authoritative YoY trajectory chart definition.
- .claude/skills/the-corporate-brand/SKILL.md — full brand system.
PROGRESS.md in the root is read at every session start per the Session Protocol.
