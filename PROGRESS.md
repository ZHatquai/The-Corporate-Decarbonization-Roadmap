# PROGRESS — The Corporate Decarbonization Roadmap

> Claude Code: read this file at the start of every session, before touching anything. Update it at every save point. Replace content — do not append. History lives in git.

**Session:** 1 — First Session Setup complete; database layer next
**Last updated:** 15 June 2026 — session 1
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state
First Session Setup done. Repo layout reorganized: the four reference docs now live in `docs/` (product-spec.md, supabase-setup.md, waterfall-chart-spec.md, yoy-trajectory-chart-spec.md); the the-corporate-brand skill is installed at `.claude/skills/the-corporate-brand/SKILL.md`; `.gitignore` added. CLAUDE.md and PROGRESS.md remain in the root. No app code or database changes yet — the build runs DB-first, then a checkpoint before the frontend.
[Rule: this section describes what exists and works right now — never what is planned. Completed checklist items get absorbed here in compressed form.]

## Last session
Session 1: ran First Session Setup (created docs/, moved the four reference docs via git mv, installed the brand skill as SKILL.md, added .gitignore). Confirmed the build approach with the builder and wrote the approved build plan. Next: Phase 1 — the live database layer, ending at a checkpoint.
[Rule: 3–5 lines maximum. Replace each session — what was built, changed, or fixed.]

## Remaining work
- [ ] Connect to Supabase project "The Corporate Space", read docs/supabase-setup.md, and review the live schema via MCP before any database work
- [ ] FIRST migration (atomic, before any dr_ table): rename ec_user_roles → user_roles, recreate the dependent helpers/trigger/backfill, expand the role constraint to add 'sourcing_manager', redeploy invite-user, then re-run the Emissions Platform verification matrix — do not proceed until it passes
- [ ] Create dr_projects, dr_annual_inventory, dr_comments with explicit RLS policies (reuse the ec_private helpers; add sourcing_manager handling)
- [ ] Build the five SECURITY DEFINER workflow functions (advance, approve, return, resubmit, publish) and grant/revoke EXECUTE per migration 0013
- [ ] Seed dr_annual_inventory for 2023 (base year), 2024, and 2025
- [ ] Update docs/supabase-setup.md: the rename, the new role value, the three dr_ tables, their RLS, and the functions
- [ ] Build Login — magic-link sign-in, then route by role
- [ ] Build Access-not-provisioned — signed-in account with no user_roles row
- [ ] Build ESG lead — Roadmap — the waterfall and YoY trajectory, per the two chart specs
- [ ] Build ESG lead — Emissions & projects — per-plant Scope 1/2 (live), the full project list with financials, and the MAC curve
- [ ] Build ESG lead — Annual inventory — publish-and-freeze panel fed by the platform's approved Scope 1/2 plus entered Scope 3
- [ ] Build ESG lead — Approval queue — advance, approve, and return-with-comment via the workflow functions
- [ ] Build ESG lead — Settings → Users — invite into user_roles via the existing invite-user function
- [ ] Build Plant manager — Submission form — own plant fixed, creates a project in 'evaluation'
- [ ] Build Plant manager — Status list — own-plant projects, return comments, revise-and-resubmit
- [ ] Build Sourcing manager — Submission form + Status list — global projects (plant_id NULL)
- [ ] Local test pass — full walkthrough of every view and role routing before deploying
- [ ] Acceptance criteria pass — verify every criterion in spec Section 13 (15 criteria) before deploy
- [ ] Deploy to Netlify — builder adds VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Netlify dashboard
[Rule: completed items leave this list and are absorbed into Current state. This list only shrinks.]

## Build decisions
- Branch & deploy: develop on `claude/sleepy-lamport-hswsyc`, commit/push there each save point, and open a PR to `main` (merge → Netlify deploy). Deliberate deviation from CLAUDE.md's "push to main", agreed with the builder.
- Charts: custom inline SVG (no charting library), fed by one shared engine — chosen for the bespoke two-tone bars, step connectors, and shaded decision-gap band.
- Frontend stack picks: Vite + React (JS), `react-router-dom` v6 for role routing, `@supabase/supabase-js`.
- Role resolution in the browser uses an own-row `select` on `user_roles` (the `ec_private.*` helpers are a private schema, not REST-exposed).
- Execution sequencing: DB layer first, then a checkpoint for builder go-ahead before the frontend.
[Rule: one line per decision made during the build that is not in the spec — prompt structures, field formats, naming choices, library picks. Future sessions depend on these to stay consistent.]

## Known issues
- Confirm Scope 1 vs 2 is derivable from each ec_submission_lines line's emission factor (EF-S1-/EF-S2- prefix) against the live schema before building the inventory aggregation (spec Open Question, Claude Code to resolve).
- MAC curve scope defaults to approved + pending; the ESG lead may later want evaluation candidates included too (spec Open Question).
- Trajectory parameters (growth, target, SBTi cap, threshold) are fixed config this build; confirm they should stay non-editable (spec Open Question).
- Per-plant emissions view defaults to the latest reported year with a year selector; confirm this granularity (spec Open Question).
- Supabase Free plan pauses after ~1 week idle; wake the project in the dashboard if REST calls fail after a quiet period (from supabase-setup.md).
- The Emissions Platform demo dataset (migration 0012) is still live, so per-plant figures and the inventory preview reflect demo data until it is removed when real data flows (from supabase-setup.md).
[Rule: bugs, edge cases, and deferred fixes. One line each. Remove when resolved.]

## Notes for next session
- Supabase access: the `mcp__Supabase__*` tool calls were blocked by an approval gate in session 1, so the database layer could not start. The builder is opening a fresh session to allow those tools. In the new session, set `mcp__Supabase__*` to "Always allow" before starting Phase 1.
- Resume point: **Phase 1 — Database layer**, following `docs/build-plan.md` (the full approved plan). Phase 0 (First Session Setup) is done and committed. Run Phase 1 end-to-end, then STOP at the checkpoint (1j) for builder go-ahead before any frontend work.
- Branch/deploy reminder: commit/push to `claude/sleepy-lamport-hswsyc` and open a PR to `main` (do not push directly to main).
[Rule: the builder writes here between sessions. Claude Code reads these aloud at session start, acts on them, then clears this section.]
