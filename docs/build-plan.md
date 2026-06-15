# Build Plan — The Corporate Decarbonization Roadmap

> Approved build plan, persisted into the repo so it survives across sessions
> (the ephemeral `/root/.claude/plans/` copy does not). A fresh session reads
> `PROGRESS.md` first per the CLAUDE.md Session Protocol, which points here.

## Status snapshot
- **Phase 0 — First Session Setup: DONE** (committed). docs/ organized, brand skill installed, .gitignore added, PROGRESS.md at session 1.
- **Phase 1 — Database layer: NOT STARTED.** Blocked in session 1 because the Supabase MCP tool calls were gated behind an approval that was not granted. Resume here once `mcp__Supabase__*` tools are allowed.
- **Phase 2 — Frontend: NOT STARTED** (gated on the Phase 1 checkpoint).

## Decisions (confirmed with builder)
1. **Branch & deploy:** develop on `claude/sleepy-lamport-hswsyc`, commit/push there each save point, and **open a PR to `main`** (merge → Netlify deploy). Deliberate deviation from CLAUDE.md's "push to main".
2. **Charts:** **custom inline SVG** (no charting library), fed by one shared engine.
3. **Sequencing:** **DB layer first, then checkpoint** — apply + verify the DB layer, update `docs/supabase-setup.md`, commit, then pause for builder go-ahead before the frontend.

## Reusable assets already in place (do not rebuild)
- `ec_private` helpers: `auth_ec_role()`, `auth_ec_plant_id()`, `auth_ec_is_admin()`, `auth_ec_manages_plant(text)` — reuse in all `dr_` RLS policies.
- `handle_new_ec_user()` auth-link trigger, `ec_link_pending_users()` backfill, `invite-user` Edge Function, `ensure_rls`/`rls_auto_enable()` auto-RLS — reuse; only update table-name references.
- Patterns to mirror: SECURITY DEFINER self-authorizing RPCs (`ec_*`), migration-0013 EXECUTE grant hardening, rolled-back-transaction verification, the `ec_submission_lines` snapshot.

---

## Phase 1 — Database layer (live, via Supabase MCP) — **ends at CHECKPOINT**

**1a. Introspect the live schema first** (`list_tables` verbose; `pg_get_functiondef` for the six dependent functions; `pg_get_constraintdef` for the `ec_user_roles` role check; columns of `ec_submission_lines`/`ec_submissions`/`ec_emission_factors`). **Resolve the blocking open question:** does an approved line carry the factor **code** (`ef_id`/snapshot) so the `EF-S1-`/`EF-S2-` prefix is readable directly, or only `snap_ef_kgco2e` (needing a join to `ec_emission_factors`)?

**1b. First atomic migration (before any `dr_` table).** Dry-run in a `BEGIN … ROLLBACK` transaction, then `apply_migration`:
- `ALTER TABLE ec_user_roles RENAME TO user_roles;`
- `CREATE OR REPLACE` the four `ec_private` helpers + `handle_new_ec_user` + `ec_link_pending_users` to reference `user_roles` (names/schema unchanged — only the table reference).
- Expand the `role` check constraint to add `'sourcing_manager'` (keep `esg_admin`, `plant_manager`).

**1c. Redeploy `invite-user`** (`get_edge_function` → update the `ec_user_roles` reference → `deploy_edge_function`, `verify_jwt=true`).

**1d. Re-run the platform verification matrix** (rolled-back txns, `set local role`): anon → nothing, no-role → nothing, `esg_admin` → all, `plant_manager` → own plant only. **Do not proceed until it passes** (acceptance criteria 1 & 2).

**1e. Create the three `dr_` tables** (RLS auto-enabled; ship explicit policies — auto-enable with no policy = default-deny). Fields exactly per spec Section 5:
- `dr_projects` (project_code, plant_id nullable, area, scope, name, description, abatement_tco2e, start_year, is_removal, capex_usd, opex_annual_usd, mac_usd_per_tco2e, status default `evaluation`, submitted_by, timestamps). Add a sequence + BEFORE-INSERT trigger for `project_code` (`DC-###`, e.g. `DC-001`; starting value is a minor build decision) and an `updated_at` trigger.
- `dr_annual_inventory` (year PK, scope1/2/3, total, status, published_at, updated_at).
- `dr_comments` (id, project_id FK cascade + index, author, comment, from_status, created_at).

  RLS (reuse `ec_private` helpers, add `sourcing_manager`):
  - `dr_projects`: plant_manager own-plant (insert in `evaluation` w/ plant forced; update only while `status='restudy'`); sourcing_manager same for global (`plant_id IS NULL`); esg_admin read-all, no direct insert/update; anon/no-role nothing.
  - `dr_annual_inventory`: esg_admin read/insert/update only; all others nothing.
  - `dr_comments`: plant_manager reads own-plant project comments, sourcing_manager reads global, esg_admin reads all; inserts only via `dr_return_project`.

**1f. Five SECURITY DEFINER workflow functions** (self-authorizing; `GRANT EXECUTE TO authenticated`, `REVOKE FROM anon, PUBLIC` per the 0013 pattern). Status is set ONLY here:
`dr_advance_project` (evaluation→pending), `dr_approve_project` (pending→approved), `dr_return_project(id, comment)` (evaluation|pending→restudy; raise if comment empty; write one `dr_comments` row w/ from_status), `dr_resubmit_project` (owner; restudy→evaluation), `dr_publish_inventory(year, scope3_tco2e)` (read approved location-based S1/S2 for the year + entered S3 → total → upsert frozen row; `base_year` for 2023 else `reported`; re-publish overwrites).

**1g. One read-only aggregation function** (resolves 1a server-side, keeps the fragile join out of the browser, makes the publish preview and per-plant view agree): `dr_plant_scope_totals(year)` → `plant_id, scope1, scope2` and/or `dr_preview_inventory(year)` → `scope1, scope2`. Grant to `authenticated`, revoke anon/PUBLIC.

**1h. Seed `dr_annual_inventory`** for 2023 (`base_year`, total **690000** to match the chart-spec baseline), 2024 (`reported`, 683000), 2025 (`reported`, 673000) — totals matching the trajectory actuals; scope1/2/3 split for 2025 aggregated from live platform data where available, 2023/2024 split to sum to the actuals (record the split as a build decision).

**1i.** Run `get_advisors(security)`; confirm no new RLS holes. Update `docs/supabase-setup.md` (rename, new role value, three `dr_` tables + RLS, the five functions + the aggregation function, seed).

**1j. Commit + push.** Save point: "Database layer". **→ CHECKPOINT: stop and report; await go-ahead.**

## Phase 2 — Frontend (after checkpoint approval)

Scaffold: Vite + React (JS) + Tailwind, `react-router-dom` v6, `@supabase/supabase-js`. Brand tokens from `BRAND.md` (now `.claude/skills/the-corporate-brand/SKILL.md`) into `index.css` (`:root`) + `tailwind.config.js` (`ink/stone/linen/chalk/lime`, `borderRadius` 0, Playfair Display + DM Sans). Anon key only; `.env.example` with no values. Invoke the `the-corporate-brand` skill for all UI/chart work.

Build in save-point-sized chunks (each a committable working increment):
- **FE-0** Scaffold + brand primitives (`Logo`, `Button`, `Card`, `Field`, `Table`, `StatusBadge`), `lib/supabaseClient.js`.
- **FE-1** Auth + role gate + routing: `useSession`, `useRole` (own-row `select role,plant_id from user_roles` — **not** `ec_private.*`), `Login` (magic link), `AccessNotProvisioned`, role redirects (esg_admin→`/app/roadmap`, managers→`/work/status`). *(AC 3)*
- **FE-2** Shared pure engine: `lib/config.js` (growth 0.0075, base 2023, target 2045, cap 0.10, threshold 1000), `lib/trajectoryEngine.js` (`computeRoadmap()` → waterfall single-year decomposition **and** the per-year sweep), `lib/macCurve.js`, `lib/format.js`. Validate against the spec example (carbon_debt ≈ 813,300; net ≈ 0; removals ≈ 9.0%).
- **FE-3** Manager surface: `ProjectForm` (mode = plant-fixed vs global), `SubmissionForm`, `StatusList`, `CommentTrail`, resubmit via `dr_resubmit_project`. *(AC 4, 5, partial 7)*
- **FE-4** Admin approval: `AppShell`+`AdminNav`, `ApprovalQueue`, `ProjectDetail`, advance/approve/return RPCs (comment required). *(AC 7)*
- **FE-5** Annual inventory: `PublishPanel` (live S1/S2 preview via `dr_preview_inventory`, S3 entry, total, publish/re-publish). *(AC 8)*
- **FE-6** Roadmap charts (custom SVG): `chartScales`, `ChartFrame`, `WaterfallChart` (two-tone floating bars + step connectors), `TrajectoryChart` (committed/target lines + shaded decision-gap + actuals overlay + net-zero marker), `SbtiBadge`, fed by `useRoadmapData`. Brand chart-colour roles: Ink = baseline/approved/actuals, Stone = growth/pending/BAU, lime only inside black (net-zero marker + SBTi-OK badge, ≤2/page). *(AC 9, 10, 11)*
- **FE-7** Emissions & projects + MAC curve: per-plant S1/2 via `dr_plant_scope_totals` (year selector, default latest reported), full project list, `MacCurveChart` (width=abatement, height=MAC, asc by MAC). *(AC 12)*
- **FE-8** Settings → Users: list + invite (insert `user_roles` row → invoke `invite-user` → `ec_link_pending_users()`). *(AC 13)*
- **FE-9** Local test pass + responsive polish (700px + mobile, lime budget, hairlines, square corners), then deploy.

## Critical files
- `src/lib/trajectoryEngine.js` — the single shared pure engine both charts depend on (highest-risk logic; maps directly to the two chart-spec formulas).
- `src/App.jsx` + `src/hooks/useRole.js` — session/role gate and role-based routing; role via own-row select.
- `src/data/api.js` — single surface for every query + RPC (incl. the per-plant scope aggregation).
- `src/components/charts/WaterfallChart.jsx` / `TrajectoryChart.jsx` — the bespoke custom-SVG charts.
- DB objects (via MCP, no repo SQL files) + `docs/supabase-setup.md` kept as schema source of truth.

## Verification (maps to spec Section 13, 15 criteria)
- **DB (Phase 1):** rolled-back-transaction role simulations — anon/no-role/esg_admin/plant_manager/sourcing_manager scoping on `dr_*`; sourcing_manager sees no `ec_` data; status changes only via RPCs; `dr_return_project` rejects empty comment; publish writes correct frozen total; `get_advisors` clean. Portal objects unchanged. *(AC 1, 2, 6, 7, 8)*
- **Engine (FE-2):** unit-check reconciliation `baseline + growth − reductions − removals = net`; both trajectory lines start at baseline, target ≈ 0 at 2045, committed > 0. *(AC 9, 10)*
- **Charts:** only approved+pending affect them; evaluation/restudy never appear. *(AC 11)*
- **End-to-end:** sign in each role; manager submits → admin advance/approve/return-with-comment → submitter sees comment → resubmit; publish inventory; invite a sourcing_manager. *(AC 3–8, 12, 13)*
- **Deploy:** PR to `main` → Netlify deploy; builder sets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in the Netlify dashboard; live URL loads on desktop + mobile. *(AC 14)*
- **Docs:** `docs/supabase-setup.md` reflects rename, new role, `dr_` tables, RLS, functions. *(AC 15)*

## Notes / open items carried into the build
- Confirm the Scope 1/2 derivation (factor code vs numeric snapshot) before building 1g/§FE-7.
- `project_code` starting number and the 2023/2024 scope1/2/3 seed split are minor build decisions to record in PROGRESS.md.
- Supabase Free plan pauses after ~1 week idle — wake in dashboard if REST 5xx; demo dataset (0012) is still live, so per-plant figures reflect demo data until removed.
