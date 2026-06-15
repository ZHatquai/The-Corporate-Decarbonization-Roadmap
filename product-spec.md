# Product Spec — The Corporate Decarbonization Roadmap

**Version:** 1.0
**Date:** 15 June 2026
**Author:** Zyad Hatquai
**Status:** Confirmed
> The Tool Architect sets this to **Confirmed** when the builder confirms the Phase 10 summary. The Project Governor will not accept a spec in any other status.

---

> **How to use this template**
> Fill in every section that applies to your tool. Sections marked **CONDITIONAL** can be skipped if the condition does not apply. When complete, this document is handed to the Project Governor skill to produce a CLAUDE.md and PROGRESS.md. For Tier 2 and Tier 3 tools, Claude Code builds all Supabase infrastructure via MCP during the build session using the information in this spec. A Supabase QA skill can be used after the build to verify the setup.

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Decarbonization Roadmap

**What it does:** It turns The Corporate's two static decarbonization charts (a waterfall bridge and a year-on-year trajectory) into a live, role-based web tool, fed by real data, and adds a project submission and approval workflow. The ESG lead reviews the live roadmap and a financial analysis view; plant and sourcing managers submit decarbonization projects and track their status.

**Who uses it:** The ESG sustainability lead at The Corporate (a five-plant global manufacturer), the plant managers at each of the five plants, and a sourcing manager who owns the corporate-wide and supply-chain projects. All are internal employees, invited individually.

**Why it exists:** It gives the ESG lead one live, governed picture of the path to net-zero (committed versus potential abatement, removals against the SBTi cap, and the cost of each lever), while giving the people who actually own the projects a structured way to propose them and see where they stand in the approval process. It replaces a static, hand-built chart with a system that updates as real emissions and real projects move through the pipeline.

**Build status:** First build. It composes two existing static chart specifications (the decarbonization waterfall and the YoY trajectory, both supplied as reference documents) and extends the backend of the existing Emissions Platform. No prior version of this tool exists.

---

## Section 2 — Classification

This section defines the architecture of the tool. Every downstream decision follows from this.

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** Managers submit projects that the ESG lead reviews later across multiple sessions, and the annual emissions inventory and the project pipeline must persist and be auditable over years.

**D3 is triggered if any of the following are true — check all that apply:**
- [x] Data must be retrievable after the session ends
- [x] Multiple sessions contribute to the same dataset
- [x] An audit trail or history is needed
- [x] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | No |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | Yes |

**Reason:** The ESG lead sees the full picture and the charts, each plant manager sees only their own plant's projects, and the sourcing manager sees only the corporate and supply-chain projects, so different roles see different data.

> **Promotion rule:** Auth requires a database. If the access model is A2 or A3, the data model is D3 — even when all displayed content is fixed. D1/D2 combined with A2/A3 are not valid classifications; they resolve to D3.

---

### If Access Model is A2 — complete both questions

Not applicable. Access model is A3.

---

### If Access Model is A3 — define all roles

| Role name | Who this is | What they can see | What they can do |
|-----------|------------|-------------------|-----------------|
| ESG lead (`esg_admin`) | The corporate ESG / sustainability lead. Existing role on the Emissions Platform. | Everything: the roadmap charts, the emissions-and-projects analysis view with the MAC curve, the annual emissions inventory, the full project pipeline across all plants and global, and user management. The only role with analysis and chart views. | Drive the whole project workflow (advance, approve, return with comment), publish and freeze the annual inventory (Scope 1 and 2 from the platform, Scope 3 entered), and invite users. |
| Plant manager (`plant_manager`) | The site manager at one of the five plants. Existing role on the Emissions Platform, scoped to a single plant. | Only their own plant's decarbonization projects and the return comments on them. No charts, no other plants, no global projects, no inventory. | Submit new projects for their own plant, track status, and revise and resubmit a project that has been returned (restudy). |
| Sourcing manager (`sourcing_manager`) | The procurement / sourcing owner of the corporate-wide and supply-chain levers (grid, materials, logistics, suppliers, removals). **New role added in this build.** | Only the corporate / global projects (those with no plant attached) and their return comments. No charts, no plant projects, no inventory. | Submit new global projects, track status, and revise and resubmit a returned (restudy) global project. |

---

### Tier

**Tier:** 3

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

D3 + A3 resolves to Tier 3: login plus different permissions per role on a shared database.

---

### Standalone or Stack

**This tool is:** Standalone. It does not have a public-facing side, so it is not a stack. All three roles are authenticated, invited employees.

> Note: although standalone, this tool is **not greenfield**. It is added to an existing Supabase project that already runs two tools (the Supplier Portal and the Emissions Platform). It reuses that project's auth, its role table, and its plant register, and it reads the Emissions Platform's approved emissions. See Sections 4, 5, and 6.

---

## Section 3 — Arms

Arms are capabilities added to the tool. They do not change the tier. Mark each arm active or not, and complete the detail only for active arms.

> **Document search and AI knowledge bases are outside this framework version.** Not used in this tool.

---

### AI API Arm

**Active:** No

---

### Export Arm

**Active:** No

> Deferred to a future version. See Section 12.

---

### Email Arm

**Active:** No

> No notifications on submit, return, or approval in this build. Deferred to a future version (see Section 12). Note: this is distinct from the **auth invite email**, which is not an arm. The invite email is sent by the existing `invite-user` Supabase Edge Function (Supabase Auth SMTP via Resend), already configured on the project. This build reuses that function for inviting the new sourcing manager and any other user; it requires no new email arm and no new credential.

---

### Scheduled Automation Arm

**Active:** No

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind |
| Deployment target | Netlify |
| Netlify MCP | Not active. The Netlify connector is not active in Claude Desktop. Netlify is connected to the builder's GitHub account and deploys the site automatically on push to main. After the first deploy, the builder adds the two Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) once in the Netlify dashboard. Claude Code does not deploy via MCP. |

**GitHub — pre-build requirement for all Tier 1, 2, and 3 tools:**
The user creates the GitHub repo before the first Claude Code session. The product-spec.md, CLAUDE.md, and PROGRESS.md must be uploaded to the repo root before Claude Code opens. The two chart specification documents and the existing `supabase-setup.md` must also be in the repo (see Build Path). Claude Code assumes the repo exists, commits changes regularly, and pushes to main. It does not create or configure the repo.

---

### CONDITIONAL: Supabase project — only complete if Tier 2 or Tier 3

**Supabase project status:** Existing. A project already exists for this context and runs two other tools.

**Supabase plan:** Free. It pauses after roughly one week of no traffic; wake it in the Supabase dashboard if REST calls fail after a quiet period. This is the existing project's current plan and is shared by all three tools.

**If existing:**

| Detail | Answer |
|--------|--------|
| Project name | The Corporate Space |
| Project ID | `vbtuzjprzusqsxawmgyl` |
| supabase-setup.md location | docs/supabase-setup.md in the project folder |

> Claude Code will read supabase-setup.md before making any schema changes. It will not recreate tables or policies that already exist. The supplied `supabase-setup.md` documents the Supplier Portal and the Emissions Platform in full; Claude Code treats it as the schema source of truth and reviews the live schema via MCP before touching anything.

**supabase-setup.md — all Tier 2 and Tier 3 tools:**
This file already exists for this project. Claude Code **updates** it at the end of this build to record the new `dr_` tables, the new RLS policies, the new role value, and the table rename described in Section 5. It remains the schema source of truth for future sessions and for the Supabase QA skill.

---

### CONDITIONAL: Only complete if this tool is part of a stack

Not applicable. Standalone tool (no public-facing side). It shares the existing Supabase project with the Supplier Portal and the Emissions Platform, but it is not part of a public/internal submission stack.

---

## Section 5 — Data Architecture

### CONDITIONAL: Only complete if Data Model is D3

This section is the input Claude Code uses to build the database schema via MCP. Describe tables and fields in plain language — Claude Code handles the technical implementation.

> **Naming convention.** The existing project uses `tc_` for shared Corporate registers and `ec_` for Emissions Platform objects. This tool's new objects use the prefix **`dr_`** (decarbonization roadmap). The one exception is the shared role table, which is **renamed** to a neutral `user_roles` because it is now shared across both the Emissions Platform and this tool (see the rename task below).

> **All new `dr_` tables get RLS auto-enabled by the project's existing `ensure_rls` event trigger.** Auto-enable with no policy means default-deny everything, so Claude Code must ship explicit policies for every `dr_` table (Section 6).

#### Required schema change before building: rename `ec_user_roles` to `user_roles`

This is a confirmed, deliberate change to a live, shared table. It must be performed as **one atomic migration** at the start of the build, before any `dr_` table is created, because several live objects reference the table by name and will error the moment the old name disappears:

- the four `ec_private` RLS helper functions: `auth_ec_role`, `auth_ec_plant_id`, `auth_ec_is_admin`, `auth_ec_manages_plant`
- the auth-link trigger function `handle_new_ec_user` and the backfill function `ec_link_pending_users`
- the `invite-user` Edge Function, which reads the table to confirm an `esg_admin` caller
- every RLS policy on the `ec_` tables that calls those helpers (the policies call helpers, not the table directly, but the helpers name the table)
- the seed rows (for example the pending `z.hatquai@gmail.com` admin invite)

A bare `ALTER TABLE ... RENAME` updates foreign keys automatically, but function bodies and the Edge Function reference the table by name and must be updated. The migration must therefore:

1. Rename `ec_user_roles` to `user_roles`.
2. Recreate (`CREATE OR REPLACE`) every function above so it references `user_roles`.
3. Expand the `role` check constraint to add the new value `sourcing_manager` (existing values `esg_admin`, `plant_manager` retained).
4. Redeploy the `invite-user` Edge Function with the updated table name.
5. Re-run the Emissions Platform verification matrix before continuing: `anon` sees nothing on every `tc_`/`ec_` table, an authenticated user with no role row sees nothing, `esg_admin` sees all, `plant_manager` sees only their own plant.

The Supplier Portal (`submissions`, `questionnaire_responses`, the `supplier-csv-uploads` bucket, the `ensure_rls` / `rls_auto_enable` objects) does **not** reference this table and must be left untouched. Helper names and the `ec_private` schema stay as they are; only the table is renamed. `docs/supabase-setup.md` is updated to reflect the rename and the new role value.

**What data is collected or stored in this tool:**

`dr_projects` — one row per decarbonization project:

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| id | Internal ID | UUID (PK) | Automatic | Yes |
| project_code | Project code (e.g. DC-040) | Text | System-assigned on creation, sequential and human-readable | Yes |
| plant_id | Plant | Text, FK to `tc_plants.plant_id`, **nullable** (NULL = corporate/global) | Set automatically from the submitter's role: a plant manager's own plant, or NULL for a sourcing manager | No (NULL for global) |
| area | Abatement area | Text, one of: Energy efficiency, Electrification, Renewables, Materials, Logistics, Suppliers, Removals, Grid | Submitter | Yes |
| scope | GHG scope | Text, one of: `1`, `2`, `1 & 2`, `3` | Submitter | Yes |
| name | Project name | Text | Submitter | Yes |
| description | Description | Text | Submitter | Yes |
| abatement_tco2e | Annual abatement (tCO2e/yr) | Numeric | Submitter | Yes |
| start_year | Start year | Integer | Submitter | Yes |
| is_removal | Permanent removal? | Boolean, default false | Submitter | Yes |
| capex_usd | CAPEX (USD) | Numeric | Submitter | Yes |
| opex_annual_usd | Annual OPEX (USD) | Numeric | Submitter | Yes |
| mac_usd_per_tco2e | MAC (USD/tCO2e) | Numeric (entered, not computed; may be negative for cost-saving projects) | Submitter | Yes |
| status | Workflow status | Text, one of: `evaluation`, `pending`, `approved`, `restudy`, default `evaluation` | System (set on creation and on each controlled transition) | Yes |
| submitted_by | Submitting user | UUID (auth user) | Automatic | Yes |
| created_at | Created | Timestamptz, default now() | Automatic | Yes |
| updated_at | Last updated | Timestamptz | Automatic | Yes |

`dr_annual_inventory` — one row per year, the frozen official inventory:

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| year | Reporting year | Integer (PK) | ESG lead | Yes |
| scope1_tco2e | Scope 1 (tCO2e) | Numeric (location-based) | Published from the platform's approved data, or seeded for historical years | Yes |
| scope2_tco2e | Scope 2 (tCO2e) | Numeric (location-based, the only basis the platform produces today) | Published from the platform's approved data, or seeded | Yes |
| scope3_tco2e | Scope 3 (tCO2e) | Numeric | Entered by the ESG lead | Yes |
| total_tco2e | Total (tCO2e) | Numeric (= scope1 + scope2 + scope3) | Computed on publish | Yes |
| status | Year status | Text, one of: `base_year`, `reported`. 2023 = `base_year`; all other published years = `reported` | ESG lead / system | Yes |
| published_at | Published / frozen at | Timestamptz | Automatic on publish | Yes |
| updated_at | Last updated | Timestamptz | Automatic | Yes |

`dr_comments` — immutable trail of return reasons:

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| id | Internal ID | UUID (PK) | Automatic | Yes |
| project_id | Project | UUID, FK to `dr_projects.id` on delete cascade, indexed | Automatic | Yes |
| author | Author | UUID (auth user, the ESG lead) | Automatic | Yes |
| comment | Return comment | Text | ESG lead | Yes |
| from_status | Returned from | Text (`evaluation` or `pending`) | System | Yes |
| created_at | Created | Timestamptz, default now() | Automatic | Yes |

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| `dr_projects` | One row per decarbonization project, plant or global | project_code, plant_id (nullable), area, scope, abatement_tco2e, start_year, is_removal, capex/opex/mac, status |
| `dr_annual_inventory` | One frozen row per reporting year | year (PK), scope1/2/3, total, status |
| `dr_comments` | Immutable return-comment trail per project | project_id, author, comment, from_status |
| `user_roles` (renamed from `ec_user_roles`) | Shared identity / authorization table | email (PK), user_id (nullable), role, plant_id. Policies inherited from the platform; only the role constraint expands to add `sourcing_manager`. |

**Existing tables this tool reads (no changes):**

| Table | Read for | Notes |
|-------|----------|-------|
| `ec_submissions` + `ec_submission_lines` | Annual Scope 1 and 2 totals (inventory publish preview) and per-plant Scope 1 and 2 (Emissions & projects view) | Aggregate **approved** lines only. Scope 1 versus Scope 2 is determined by the emission factor referenced on each line (the platform encodes scope in its factor register, e.g. `EF-S1-…` / `EF-S2-…`). Claude Code confirms the exact mechanism from `supabase-setup.md` and the live schema before building the aggregation. `esg_admin` already has full read on these tables, so no new permission is needed. |
| `tc_plants` | Plant names and the active plant list | Read-only. |
| `user_roles` | Authentication and role resolution | Via the existing `ec_private` helpers, reused after the rename. |

**File storage:** No.

**Derived or calculated data:** Yes. The annual total is computed on publish (Section 9). The chart series (waterfall steps, YoY committed/target/actuals) and the MAC curve are computed at render time from `dr_annual_inventory` and `dr_projects` (Section 9). Annual Scope 1 and 2 figures shown in the inventory publish preview are aggregated live from the platform's approved lines.

---

## Section 6 — Access and Permissions

### CONDITIONAL: Only complete if Access Model is A2 or A3

**Auth configuration:**

| Detail | Answer |
|--------|--------|
| Authentication method | Magic link. Reuses the existing project auth exactly as the Emissions Platform uses it: invitee clicks a link in their email and is signed in, no password. Derived from context (invite-only internal tool) and confirmed by the builder. |
| Signup model | Invite-only. The ESG lead invites specific users from this tool's Settings → Users screen, which inserts a `user_roles` row and calls the existing `invite-user` Edge Function to send the auth invite. A signed-in account with no `user_roles` row sees zero data (RLS) and lands on an "access not provisioned" screen. Authentication → Enable Signups must remain ON in Supabase for a brand-new invited email to complete its first magic-link sign-in; invite-only is enforced by the membership table and RLS, not by the signup toggle. |

> **Privacy note — include in every A2/A3 spec:** User accounts store email addresses. For this internal tool that falls under The Corporate's existing privacy framework rather than a consent flow.

**Shared identity.** This tool reuses the renamed `user_roles` table and the platform's existing `ec_private` helper functions and auth-link trigger. Anyone already invited to the Emissions Platform as a plant manager can sign straight in here on the same magic link, with no re-invite, and sees their own plant's projects. The new `sourcing_manager` role is added to the same table. The platform's existing RLS helpers naturally return false for `sourcing_manager` on the `ec_` tables, so a sourcing manager sees no emissions data; Claude Code must verify this isolation after adding the role.

**RLS rules — who can read and write what:**

Describe the rules in plain language. Claude Code will translate these into RLS policies via MCP during the build session. The `dr_` policies reuse the existing `ec_private` helpers (`auth_ec_role()`, `auth_ec_plant_id()`) to resolve the caller's role and plant, adding handling for `sourcing_manager`. All workflow status changes and the inventory publish run through self-authorizing SECURITY DEFINER functions (the same pattern as the Emissions Platform's `ec_` RPCs), granted EXECUTE to `authenticated` and revoked from `anon`/`PUBLIC` (matching the platform's migration 0013 hardening). Direct table writes are limited to what is in the table below; status is never changed by a direct edit.

| Table | User type | Can read | Can insert | Can update | Can delete |
|-------|----------|----------|------------|------------|------------|
| `dr_projects` | Unauthenticated (anon) | No | No | No | No |
| `dr_projects` | Authenticated, no role row | No | No | No | No |
| `dr_projects` | `plant_manager` | Own plant only (`plant_id` = their plant) | Yes (own plant, created in `evaluation`, `plant_id` forced to their plant) | Own plant only, **and only while status = `restudy`** (revise before resubmitting); status itself never changed by direct edit | No |
| `dr_projects` | `sourcing_manager` | Global only (`plant_id IS NULL`) | Yes (global, created in `evaluation`, `plant_id` NULL) | Own global projects only, **and only while status = `restudy`**; status never changed by direct edit | No |
| `dr_projects` | `esg_admin` | All rows | No (creation is by managers) | No direct update (all transitions via the controlled functions below) | No |
| `dr_annual_inventory` | anon / no-role / `plant_manager` / `sourcing_manager` | No | No | No | No |
| `dr_annual_inventory` | `esg_admin` | All rows | Yes (publish a year, seed history) | Yes (re-publish / restate) | No |
| `dr_comments` | anon / no-role | No | No | No | No |
| `dr_comments` | `plant_manager` | Comments on their own plant's projects only | No (created by the return function) | No | No |
| `dr_comments` | `sourcing_manager` | Comments on global projects only | No (created by the return function) | No | No |
| `dr_comments` | `esg_admin` | All rows | No direct insert (the return function writes it) | No | No |
| `user_roles` | (all) | Inherited from the Emissions Platform unchanged. `esg_admin` reads all and inserts invites; managers/sourcing managers resolve only their own row via the helpers. Only schema change is the rename and the added `sourcing_manager` role value. | | | |

**Controlled workflow functions (SECURITY DEFINER, self-authorizing — implement like the platform's `ec_` RPCs):**

- `dr_advance_project(project_id)` — `esg_admin` only. Moves `evaluation` → `pending`.
- `dr_approve_project(project_id)` — `esg_admin` only. Moves `pending` → `approved`.
- `dr_return_project(project_id, comment)` — `esg_admin` only. Moves `evaluation` → `restudy` **or** `pending` → `restudy`. Comment is **required** (raise if empty); writes one `dr_comments` row with `from_status`.
- `dr_resubmit_project(project_id)` — owner (`plant_manager` for own-plant, `sourcing_manager` for own global) only. Moves `restudy` → `evaluation`.
- `dr_publish_inventory(year, scope3_tco2e)` — `esg_admin` only. Reads the platform's approved Scope 1 and 2 totals (location-based) for `year`, takes the entered Scope 3, computes total, and upserts the `dr_annual_inventory` row (frozen). Re-publishing overwrites the row (restatement). Sets `status = 'base_year'` for 2023, `'reported'` otherwise.

> Claude Code builds all RLS policies and these functions during the build session via Supabase MCP. The Supabase QA skill can be used after the build to verify that policies are correctly applied and that the role isolation holds.

---

## Section 7 — GDPR

### MANDATORY DECISION

**GDPR outcome:** Not applicable. Confirmed during the interview that this tool collects no personal data through its forms or uploads. The submission form collects project and cost data only (area, scope, name, description, abatement, start year, removal flag, CAPEX, OPEX, MAC). The only personal data anywhere in the tool is the login email, which is invite-only auth covered by the Section 6 privacy note and The Corporate's existing privacy framework, not a public open-signup tool, so it does not trigger the consent flow.

> **Scope rule:** GDPR applies here when the tool collects personal data through its forms or uploads. Login emails stored by Supabase Auth on an invite-only internal tool do not trigger this section. This tool has no personal-data form fields and no open public signup, so the outcome is a confirmed "not applicable".

---

## Section 8 — Screen and UI Structure

After login, the app routes by role: `esg_admin` lands on the Roadmap; `plant_manager` and `sourcing_manager` land on their Status list. Any signed-in user with no `user_roles` row sees the Access-not-provisioned screen.

### Login

- **Purpose:** Let an invited user sign in by magic link.
- **What is visible:** The Corporate-branded sign-in with an email field and a "send magic link" action; confirmation that a link has been emailed.
- **User actions:** Enter email, request the magic link, click the link in the email to complete sign-in.
- **What happens next:** On success, the auth-link trigger links the account to its pending `user_roles` row by email and the user is routed to their role's home view.

### Access not provisioned

- **Purpose:** Catch a signed-in account that has no role row.
- **What is visible:** A short message that access has not been provisioned and who to contact.
- **User actions:** None beyond sign-out.
- **What happens next:** Stays here until an ESG lead invites the email (adds a `user_roles` row).

### ESG lead — Roadmap

- **Purpose:** The live decarbonization roadmap, the two charts from the supplied chart specs.
- **What is visible:** The decarbonization waterfall (2023 baseline grown to the 2045 target, stepping down by abatement area with the approved/pending two-tone, then removals, to net, with the SBTi removals-under-10% badge) and the YoY trajectory (committed line, target line, the shaded decision-gap band between them, and measured actuals). Title, value labels, legends, and axes per the chart specs.
- **User actions:** View only; optional hover readouts as described in the chart specs.
- **What happens next:** Nothing changes; this is a reporting view. Data comes from `dr_annual_inventory` (baseline and actuals) and `dr_projects` filtered to `approved` and `pending`.

### ESG lead — Emissions & projects

- **Purpose:** The financial and per-plant analysis view.
- **What is visible:** Per-plant Scope 1 and 2 emissions for the selected reporting year (read live from the platform's approved data, default to the latest reported year, with a year selector); the full project list (all statuses) with their financials (CAPEX, annual OPEX, MAC, abatement, area, scope, plant or global, status); and the MAC curve, projects ranked cheapest to most expensive by MAC with bar width proportional to annual abatement.
- **User actions:** View only; select the year for the per-plant breakdown.
- **What happens next:** Nothing changes; analysis view.

### ESG lead — Annual inventory

- **Purpose:** Publish and freeze the official annual inventory that feeds the charts.
- **What is visible:** The list of published years (Scope 1, 2, 3, total, status). A publish panel for a chosen year showing the platform's approved Scope 1 and 2 (location-based) computed live and read-only, a Scope 3 entry field, and the computed total. Existing rows can be re-published (restatement). Seeded historical rows for 2023 (base year), 2024, and 2025 appear here.
- **User actions:** Choose a year, enter Scope 3, publish (freeze) the year; re-publish to restate.
- **What happens next:** Publishing calls `dr_publish_inventory`, which writes the frozen `dr_annual_inventory` row. The charts then read that frozen row rather than the live figure.

### ESG lead — Approval queue

- **Purpose:** Operate the project workflow.
- **What is visible:** Every submitted project across all plants and global, with status, project detail, financials, and the comment history. Projects awaiting action are surfaced.
- **User actions:** Advance an `evaluation` project to `pending`; approve a `pending` project; return an `evaluation` or `pending` project to `restudy` with a required comment.
- **What happens next:** Each action calls the matching controlled function (`dr_advance_project`, `dr_approve_project`, `dr_return_project`). A return writes a `dr_comments` row and the submitter sees it on their status view.

### ESG lead — Settings → Users

- **Purpose:** Invite and provision users into the shared `user_roles`.
- **What is visible:** The current users (email, role, plant) and an invite form (email, role: `esg_admin` / `plant_manager` / `sourcing_manager`; plant required when role is `plant_manager`).
- **User actions:** Invite a user, which inserts the `user_roles` row and calls the existing `invite-user` Edge Function to email the auth invite.
- **What happens next:** The invitee receives the magic-link invite; on first sign-in the auth-link trigger links their account. An already-registered email is handled gracefully (the person can sign in directly).

### Plant manager — Submission form

- **Purpose:** Submit a new decarbonization project for the manager's own plant.
- **What is visible:** Fields for area, scope, name, description, annual abatement (tCO2e), start year, removal yes/no, CAPEX (USD), annual OPEX (USD), and MAC (USD/tCO2e). The plant is shown as fixed (their own plant) and not editable.
- **User actions:** Fill the form and submit.
- **What happens next:** A `dr_projects` row is created with the manager's plant and `status = 'evaluation'`. The manager is returned to their Status list.

### Plant manager — Status list

- **Purpose:** Track the manager's own plant's projects.
- **What is visible:** A list of the manager's plant projects with status, financials, and, for any returned (`restudy`) project, the ESG lead's comment. A revise-and-resubmit action on returned projects.
- **User actions:** View status; on a returned project, edit the fields and resubmit.
- **What happens next:** Resubmit calls `dr_resubmit_project`, moving the project from `restudy` back to `evaluation`.

### Sourcing manager — Submission form and Status list

- **Purpose:** The same two screens as the plant manager, scoped to corporate / global projects.
- **What is visible / actions / next:** Identical to the plant manager screens above, except the project has no plant (`plant_id` NULL), the manager sees only global projects, and the form is for global levers (Grid, Materials, Logistics, Suppliers, Removals).

---

## Section 9 — Logic and Calculations

### CONDITIONAL: Only complete if the tool calculates, scores, or applies decision rules

> **Authoritative chart definitions.** The two supplied documents — `waterfall-chart-spec.md` and `yoy-trajectory-chart-spec.md` — define the chart visuals, math, and acceptance criteria in full. Claude Code follows them exactly. The **only** change from those specs is the data source: values come from the live tables below instead of the static built-in config. Both charts share one engine.

**What is calculated or scored:**
1. The decarbonization waterfall (the 2045 end-state, decomposed by driver).
2. The YoY trajectory (the same engine swept across every year, plus measured actuals).
3. The annual inventory total (on publish).
4. The MAC curve (ranking).

**Inputs:**
- Baseline and actuals: the `dr_annual_inventory` rows. The base-year footprint is the `base_year` row (2023). Actuals are the published `reported` rows for complete years.
- Projects: `dr_projects` filtered to `status IN ('approved','pending')` for both charts. `approved` = committed; `pending` = potential. `evaluation` and `restudy` are excluded from both charts entirely.
- Per-project fields used by the charts: `area`, `abatement_tco2e`, `status`, `is_removal`, `start_year`.
- Configuration constants (fixed in this build, not user-editable): BAU growth rate 0.0075 per year, target year 2045, SBTi removal cap 0.10 (removals must stay under 10% of the grown carbon debt), net-zero threshold 1000 tCO2e.

**Formula or rules:**

*Waterfall* (per `waterfall-chart-spec.md`): start at the base-year footprint; step up by BAU growth to the target year (`baseline × (1 + growth_rate) ^ years_to_target`); step down once per abatement area, each area bar split into an `approved` (solid) and a `pending` (lighter) sub-amount; step down by removals (sum of `is_removal` projects within `approved`+`pending`); land on net. Show the SBTi badge with removals as a percent of the grown debt and a warning if it breaches 10%. Net reads "Net-Zero" at or below the threshold.

*YoY trajectory* (per `yoy-trajectory-chart-spec.md`): for each year from base to target, BAU = `baseline × (1 + growth_rate) ^ (year − base_year)`; each project ramps linearly from its `start_year` to the target year; the **committed** line subtracts approved non-removal projects' ramped abatement from BAU; the **target** line subtracts approved + pending + removals ramped abatement; the shaded band between them is the decision gap. Actuals are the published `reported` inventory rows, plotted only for complete years, never computed from the model.

*Annual inventory total:* `total_tco2e = scope1_tco2e + scope2_tco2e + scope3_tco2e`, computed on publish. Scope 1 and 2 are the platform's approved location-based totals for the year (or seeded historical values for 2023 to 2025); Scope 3 is entered by the ESG lead.

*MAC curve:* plot each included project as a bar, width = `abatement_tco2e`, height = `mac_usd_per_tco2e`, ordered ascending by MAC (cheapest, often negative, first). The included set is `approved` + `pending` by default, matching the charts (see Open Questions for the alternative of including `evaluation` candidates).

*State machine:* `evaluation` (set on submit) → `pending` (ESG lead advances) or `restudy` (ESG lead returns, comment required); `pending` → `approved` (ESG lead approves) or `restudy` (ESG lead returns, comment required); `restudy` → `evaluation` (owner revises and resubmits). All transitions run through the controlled functions in Section 6.

**Output:** Two rendered charts, a MAC curve, a frozen annual inventory row, and project status transitions.

**Edge cases:**
- A year with no published inventory row is simply not plotted as an actual; the base-year row must exist for the charts to anchor.
- The current (incomplete) year is never plotted as an actual.
- If the platform has no approved Scope 1/2 data for a year the ESG lead tries to publish (for example historical years before the platform's data begins), the publish preview shows zero from the platform and the ESG lead enters the historical figures directly (this is how 2023 to 2025 are seeded).
- A returned project with an empty comment must be rejected by `dr_return_project`.
- Removals breaching the 10% cap render the SBTi badge in its warning state but do not block the chart.
- Net at or below the threshold renders as "Net-Zero".

---

## Section 10 — Brand and Visual Direction

**Brand reference:** Brand skill file. Use the existing **The Corporate brand skill** (`the-corporate-brand`). Upload it flat to the repo root; Claude Code installs it to `.claude/skills/` in the first session. The Roadmap tool must read as the same system as the Emissions Platform.

**Visual feel:** Professional and corporate, data-heavy but restrained. The Corporate palette (Ink, Chalk, Linen, Stone) with the Acid Lime accent, Playfair Display for display type and DM Sans for body. Apply the brand's chart-colour roles to the waterfall and trajectory (for example ink baseline, lime net/target, distinct tones for approved versus pending and for removals) consistent with the two chart specs.

**Reference or inspiration:** The existing Emissions Platform UI in the same project, and the two supplied chart specs.

---

## Section 11 — API and Credentials

List every external service this tool connects to.

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Supabase | Database, Auth, role table, reads of the platform's data | Anon key (public, browser-safe) used by the frontend; service role key used only server-side by the existing `invite-user` Edge Function (injected by Supabase at runtime) | Anon key as a Netlify environment variable; service role key never in the repo or browser |

> **Security rule — no exceptions:** No API key, token, password, or credential may appear in any HTML file, any JavaScript file, or any file committed to GitHub. The frontend uses the anon key only, which is safe because RLS enforces all access. Claude Code must enforce this regardless of tier or context.

**Credentials readiness — filled during the architect interview for every active arm:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase anon key | Already exists on the project | Supabase dashboard → Project Settings → API |
| Supabase service role key | Already exists on the project; used only by the existing Edge Function | Supabase dashboard → Project Settings → API |

> No new credentials are needed for this build. No AI key and no Resend key are introduced; email arms are not active, and the auth invite reuses the platform's already-configured Edge Function and SMTP. The only environment variables to set are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, added once in the Netlify dashboard after the first deploy.

---

## Section 12 — Out of Scope — Phase 2

List everything this build will NOT include. Be explicit. Claude Code will not build anything listed here.

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| A real "submit to management" role and approval step | Not needed to validate the workflow. In this build the ESG lead is both evaluator and approver (advances to pending and approves). A distinct management role and a true escalation step come later. |
| All email notifications (submit, return, approve) | Not needed for the first build. The workflow is visible in-app. The auth invite email is unaffected (it is not an arm). |
| Market-based Scope 2 | The Emissions Platform produces only location-based Scope 2 today. The inventory is designed so a market-based column can be added later without disruption; the charts plot location-based for now. |
| Any export (CSV or PDF) of the project list, MAC data, or roadmap | Not needed for the first build; everything is view-only in-app. |
| ESG-lead-editable trajectory parameters (growth rate, target year, SBTi cap, threshold) | Fixed configuration in this build. Could move to a config table later (see Open Questions). |
| Direct project creation by the ESG lead | Project creation is by plant and sourcing managers only in this build. |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | The `ec_user_roles` → `user_roles` rename does not break the Emissions Platform | After the atomic migration, the platform verification matrix passes: `anon` sees nothing, an unprovisioned authenticated user sees nothing, `esg_admin` sees all, `plant_manager` sees only their plant. `invite-user` redeployed and sends invites. | [ ] |
| 2 | The Supplier Portal is unaffected by the rename | Supplier Portal tables, bucket, and `ensure_rls`/`rls_auto_enable` objects unchanged; portal anon-insert still works. | [ ] |
| 3 | Login and role routing | A valid magic link signs the user in; `esg_admin` lands on the Roadmap, managers land on their Status list; an account with no role row sees the Access-not-provisioned screen. | [ ] |
| 4 | Plant manager submission | Submitting the form creates a `dr_projects` row with `status = 'evaluation'` and the manager's `plant_id`; the manager sees only their own plant's projects. | [ ] |
| 5 | Sourcing manager submission | Submitting creates a global project (`plant_id` NULL) in `evaluation`; the sourcing manager sees only global projects and no plant projects or charts. | [ ] |
| 6 | RLS isolation | `plant_manager` reads only own-plant `dr_projects`; `sourcing_manager` reads only global; `esg_admin` reads all; `anon` reads nothing; `sourcing_manager` sees no `ec_` emissions data. | [ ] |
| 7 | Workflow transitions | `evaluation` → `pending` → `approved` work for `esg_admin`; return to `restudy` from either `evaluation` or `pending` requires a comment and writes a `dr_comments` row; the submitter sees the comment; `restudy` → `evaluation` works on resubmit; managers cannot change status by direct edit. | [ ] |
| 8 | Annual inventory publish | The publish panel shows the platform's approved Scope 1 and 2 (location-based) live; entering Scope 3 and publishing writes a frozen `dr_annual_inventory` row with correct total; 2023 is `base_year`; 2023 to 2025 seeded; re-publish overwrites. | [ ] |
| 9 | Waterfall chart | Bars reconcile (baseline + growth − reductions − removals = net within rounding); each area bar shows the approved/pending two-tone; removals bar present; SBTi badge shows removals as a percent of debt and flags any breach of 10%; net reads "Net-Zero" at or below threshold. Matches `waterfall-chart-spec.md`. | [ ] |
| 10 | YoY trajectory chart | Both planned lines start at the baseline in the base year; target reaches net-zero at 2045 and committed ends above zero; the decision-gap band is shaded; actuals appear only for complete years and are visually distinct. Matches `yoy-trajectory-chart-spec.md`. | [ ] |
| 11 | Charts exclude evaluation/restudy | Only `approved` and `pending` projects affect either chart; `evaluation` and `restudy` never appear. | [ ] |
| 12 | Emissions & projects view + MAC curve | Per-plant Scope 1 and 2 for the selected year render live from the platform; the full project list with financials renders; the MAC curve ranks projects by entered MAC with width proportional to abatement. | [ ] |
| 13 | Settings → Users invite | `esg_admin` can invite a `sourcing_manager` (and others) into `user_roles`; the invite email is sent via the existing Edge Function. | [ ] |
| 14 | Deploy | Push to main deploys via the GitHub-linked Netlify site; with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set, the live URL loads correctly on desktop and mobile. | [ ] |
| 15 | supabase-setup.md updated | `docs/supabase-setup.md` reflects the rename, the new role value, the three `dr_` tables, their RLS, and the controlled functions. | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 3

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec is written and confirmed by the builder
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created by the builder
- [ ] product-spec.md uploaded to the GitHub repo root
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] `the-corporate-brand` skill file uploaded to the GitHub repo root
- [ ] `waterfall-chart-spec.md` and `yoy-trajectory-chart-spec.md` uploaded to the GitHub repo root (authoritative chart definitions)
- [ ] The existing `supabase-setup.md` placed in `docs/` (or at the repo root for Claude Code to move into `docs/`) so Claude Code reads the current schema before any change
- [ ] Netlify connected to the GitHub repo (Netlify MCP is not active; the GitHub-linked site deploys on push)
- [ ] Confirm no new credentials needed (correct — only the existing Supabase anon key, set as a Netlify env var after first deploy)

> Claude Code organizes these files into the correct folder structure (docs/, .claude/skills/) automatically at the start of the first session.

---

### Tier 3 — build session

- [ ] Open Claude Code in the project folder
- [ ] Claude Code runs First Session Setup: creates docs/, moves reference files (including the two chart specs and supabase-setup.md), installs the `the-corporate-brand` skill
- [ ] Claude Code reads product-spec.md, CLAUDE.md, PROGRESS.md, the two chart specs, and the existing supabase-setup.md
- [ ] **Supabase — existing project:** Claude Code connects to The Corporate Space (`vbtuzjprzusqsxawmgyl`), reads supabase-setup.md, and reviews the live schema before any change
- [ ] **First migration — the rename:** atomically rename `ec_user_roles` → `user_roles`, recreate every dependent function and policy, expand the role constraint to add `sourcing_manager`, redeploy `invite-user`, then re-run the platform verification matrix (Section 5). Do not proceed until it passes.
- [ ] Claude Code builds the `dr_` tables, their RLS policies, and the controlled SECURITY DEFINER functions via Supabase MCP; seeds `dr_annual_inventory` for 2023 (base year), 2024, and 2025
- [ ] Claude Code updates docs/supabase-setup.md (rename, new role value, new tables, RLS, functions)
- [ ] Claude Code builds the frontend (role routing and all views in Section 8), following the two chart specs for the charts
- [ ] Test locally before deploying
- [ ] **Netlify MCP not active:** push to main → Netlify deploys, then add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify dashboard
- [ ] Optional post-build: run the Supabase QA skill to verify schema, RLS, role isolation, and that the platform still passes its verification matrix

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| MAC curve scope: it currently plots the same `approved` + `pending` set as the charts. Should projects still in `evaluation` also appear, so the ESG lead can rank candidates while deciding? | Builder | No — can resolve during build (default is approved + pending). |
| Trajectory parameters (BAU growth 0.75%/yr, target 2045, SBTi cap 10%, net-zero threshold) are fixed configuration. Confirm they should not be ESG-lead-editable in this build. | Builder | No — defaulted to fixed; can change later. |
| Per-plant emissions view defaults to the latest reported year with a year selector. Confirm this is the granularity you want (versus, say, a multi-year per-plant trend). | Builder | No — reasonable default; can refine during or after build. |
| Confirm Scope 1 vs Scope 2 is reliably derivable from each `ec_submission_lines` line's emission factor in the live schema (factor code prefix or a scope column). | Claude Code | Yes — confirm from supabase-setup.md / live schema before building the inventory aggregation. |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 15 June 2026 | Initial build. Tier 3, A3 with three roles (esg_admin, plant_manager, new sourcing_manager) on the shared, renamed `user_roles` table. Live decarbonization waterfall and YoY trajectory for the ESG lead, an emissions-and-projects analysis view with a MAC curve, a publish-and-freeze annual inventory fed by the Emissions Platform's approved Scope 1 and 2 plus entered Scope 3, and a project submission and approval workflow (evaluation → pending → approved / restudy with mandatory return comments). New `dr_projects`, `dr_annual_inventory`, `dr_comments` tables; `ec_user_roles` renamed to `user_roles`. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
