# PROGRESS — The Corporate Decarbonization Roadmap

> Claude Code: read this file at the start of every session, before touching anything. Update it at every save point. Replace content — do not append. History lives in git.

**Session:** 2 — DB layer done; frontend through FE-3 (scaffold, auth/routing, engine, manager surface) — all build clean
**Last updated:** 15 June 2026 — session 2
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state
**Phase 2 frontend: FE-0 → FE-5 done; `npm run build` ✓.**
- FE-0 scaffold: Vite + React (JS) + Tailwind v3 at repo root; brand tokens in `tailwind.config.js` + `src/index.css` (Chalk page / Linen surfaces / Ink text / Acid Lime reserved; Playfair + DM Sans; square corners; hairline borders). Brand primitives in `src/components/brand/` (Logo, Button, Card, Field, Input/Select/Textarea, Table, StatusBadge). `src/lib/supabaseClient.js` (anon key only). `.env.example` (no values).
- FE-1 auth + routing: `AuthProvider`/`useAuth` (session via supabase auth + own-row select on `user_roles`), `Protected` route guard (login / access / wrong-role redirects), `HomeRedirect`, magic-link `Login`, `AccessNotProvisioned`, role-aware `AppShell` (admin vs manager nav), placeholder pages for all destinations, `react-router-dom` v6 route tree. Netlify SPA config (`public/_redirects`, `netlify.toml`).
- Full auth/session behaviour verifies on the deployed site (outbound to supabase.co is blocked in the build env; no local anon key by design).
- FE-2 shared engine: `src/lib/config.js` (fixed config), `trajectoryEngine.js` (`computeWaterfall` + `computeTrajectory` + `computeRoadmap`), `macCurve.js`, `format.js`. Validated against the spec example via `node scripts/validate-engine.mjs` — ALL CHECKS PASS (carbon_debt ≈ 813,280; net ≈ −20 / Net-Zero; removals 9.01% within cap; lines start at baseline; target ≈ 0 at 2045; committed 563,280 > 0; evaluation/restudy excluded; MAC ascending).
- FE-3 manager surface: `src/data/api.js` (single query/RPC surface), `projectFields.js`, `ProjectForm` (plant fixed from role; full validation), `SubmitPage` (creates a project in evaluation; plant_id from role / NULL for sourcing), `StatusPage` (own projects table + detail panel + `CommentTrail` + resubmit via `dr_resubmit_project`). Behaviour verifies live on deploy.
- FE-4 admin approval: shared `ProjectDetail` component (used by manager + admin), `QueuePage` with status filters (Needs action / Approved / Restudy / All + counts), and advance / approve / return-with-required-comment via the workflow RPCs.
- FE-5 annual inventory: `InventoryPage` publish panel — live approved Scope 1/2 via `dr_preview_inventory` (re-fetched on year change), Scope 3 entry, computed total, publish/re-publish via `dr_publish_inventory`; published-history table with statuses.
- FE-6 roadmap charts (custom SVG): `chartScales` (scales/ticks/colours), `ChartFrame` + `LegendItem`, `WaterfallChart` (two-tone floating bars, hatched removals, step connectors), `TrajectoryChart` (committed/target lines, shaded decision-gap band, faint BAU, actuals overlay, net-zero marker), `SbtiBadge`, `useRoadmapData` hook, `RoadmapPage` with a summary stat strip. Lime budget respected (≤2/page: SBTi-OK badge + trajectory net-zero marker, both inside black).

**Phase 1 (live database layer) is complete, applied to "The Corporate Space", and verified.** Migrations 0015–0019:
- `ec_user_roles` → `user_roles` (atomic), role check expanded with `sourcing_manager`, all six dependent objects recreated to reference the new name, `invite-user` Edge Function redeployed (v2, verify_jwt=true). Emissions Platform verification matrix re-run and **passes** (anon/no-role see nothing; esg_admin all; plant_manager own-plant only; sourcing_manager sees zero `ec_` data).
- Three `dr_` tables created with explicit RLS (reusing `ec_private` helpers + sourcing_manager handling): `dr_projects` (sequence + `DC-###` code trigger + updated_at trigger), `dr_annual_inventory` (esg_admin only), `dr_comments` (immutable, read-scoped, insert via function only).
- Five workflow functions (advance/approve/return/resubmit/publish) + two read-only aggregation functions (preview, per-plant totals), all SECURITY DEFINER + self-authorizing, EXECUTE hardened to authenticated.
- `dr_annual_inventory` seeded 2023 (base_year, 690,000) / 2024 (683,000) / 2025 (673,000) — real live S1/S2 + plug S3.
- Full functional + RLS + negative-test pass in rolled-back transactions; `get_advisors(security)` clean (only the by-design SECURITY-DEFINER-RPC warnings remain). `docs/supabase-setup.md` updated as the schema source of truth.
- No app code yet. The Scope 1/2 open question is resolved (see Build decisions).
[Rule: this section describes what exists and works right now — never what is planned.]

## Last session
Session 2: applied + verified the whole DB layer (migrations 0015–0019); passed the checkpoint; then built the frontend through FE-3 — FE-0 scaffold + brand primitives, FE-1 auth/role-gate/routing, FE-2 shared engine (validated against the spec example), FE-3 manager surface (submission form + status list + comment trail + resubmit). Build green at every step.
[Rule: 3–5 lines maximum. Replace each session.]

## Remaining work
- [ ] FE-7 Emissions & projects + MAC curve: per-plant S1/2 via `dr_plant_scope_totals` (year selector, default latest reported), full project list, MacCurveChart. *(AC 12)*
- [ ] FE-8 Settings → Users: list + invite (insert `user_roles` row → invoke `invite-user` → `ec_link_pending_users()`). *(AC 13)*
- [ ] FE-9 Local test pass + responsive polish (700px + mobile, lime budget, hairlines, square corners), then deploy.
- [ ] Acceptance criteria pass — spec Section 13 (15 criteria) before deploy.
- [ ] Deploy to Netlify — builder adds VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Netlify dashboard.
[Rule: completed items leave this list and are absorbed into Current state. This list only shrinks.]

## Build decisions
- Branch & deploy: this session develops on `claude/loving-dirac-eotpfy` (session 1's `claude/sleepy-lamport-hswsyc` is merged to main via PR #1). Commit/push to the feature branch; **no PR opened automatically** — open one on the builder's request. Deviation from CLAUDE.md's "push to main", agreed with the builder.
- Scope 1/2 derivation (open question RESOLVED): the `EF-S1-`/`EF-S2-` prefix on `ec_submission_lines.snap_ef_id` matches `ec_emission_factors.scope` exactly (30 S1 / 18 S2 live). Aggregations use the prefix on the snapshot — no join, no drop risk — and live only in server-side functions.
- `project_code`: `DC-` + 3-digit zero-padded sequence (`dr_project_code_seq`), starts at 1 → first real project is `DC-001`; widens past 999 naturally.
- Inventory seed split: Scope 1/2 from the live approved aggregation; Scope 3 is the plug so the total equals the chart-spec actuals (690k/683k/673k). 2023 = base_year, 2024/2025 = reported.
- `submitted_by` (dr_projects) and `author` (dr_comments) are nullable with default `auth.uid()` and FK `ON DELETE SET NULL`, mirroring the platform's `created_by` so deleting an auth user never blocks.
- `dr_annual_inventory` has esg_admin read/insert/update policies per spec, but in practice writes go through `dr_publish_inventory` (definer); the publish function returns the upserted row for the UI.
- Charts: custom inline SVG (no charting library), one shared engine — carried from session 1.
- Frontend stack: Vite + React (JS), react-router-dom v6, @supabase/supabase-js; role via own-row select on `user_roles` (the `ec_private.*` helpers are private, not REST-exposed).
[Rule: one line per decision not in the spec. Future sessions depend on these.]

## Known issues
- MAC curve scope defaults to approved + pending; the ESG lead may later want evaluation candidates included too (spec Open Question — confirm during FE-7).
- Trajectory parameters (growth 0.0075, target 2045, SBTi cap 0.10, threshold 1000) are fixed config this build; confirm they stay non-editable (spec Open Question).
- Per-plant emissions view: default to latest reported year with a year selector; confirm granularity during FE-7 (spec Open Question).
- Live data: real 2023–2025 emissions are loaded (migration `load_real_2023_2025_data`), so per-plant figures and the inventory preview reflect real data for those years. The Emissions Platform demo dataset (0012) is still present for 2026 — harmless to this tool (it aggregates by `year`), remove upstream when desired.
- Supabase Free plan pauses after ~1 week idle; wake the project in the dashboard if REST calls 5xx after a quiet period.
- `npm audit`: 2 high-severity findings in esbuild (transitive via Vite 5) — the dev-server-only advisory (GHSA-67mh-4wv8-2f99). Does not affect the static production bundle; fix requires a Vite v8 major bump. Deferred.
[Rule: bugs, edge cases, deferred fixes. One line each. Remove when resolved.]

## Notes for next session
- (none — cleared at session 2 start; the session-1 notes about enabling Supabase MCP and resuming at Phase 1 were acted on.)
[Rule: the builder writes here between sessions. Claude Code reads these aloud at session start, acts on them, then clears this section.]
