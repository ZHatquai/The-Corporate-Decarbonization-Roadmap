# Product Spec — Decarbonization Waterfall Chart

**Standalone component.** This spec describes one chart only: the decarbonization waterfall. It is self-contained, with built-in static data, and references no backend, database, or live dashboard. It is written as a building block, to be composed later with the YoY trajectory spec and a system description into a full product spec.

---

## 1. Summary

A static waterfall (bridge) chart that shows how a base-year carbon footprint, grown to a target year, is brought to net-zero by abatement projects and permanent removals. Read left to right: where you start, what business growth adds, what each abatement area takes out (committed versus potential), what removals neutralize at the end, and where you land.

## 2. Classification

- **Tier 1.** Data model **D1** (every value is hardcoded in the component). Access model **A1** (no login).
- Pure frontend component. No backend, no database, no authentication. It renders once from its built-in data.
- Out of framework scope here: any live data source. In the composed product this chart will read real figures, but that integration is deliberately not part of this spec.

## 3. The chart, left to right

1. **Baseline** — the base-year footprint, a solid bar grounded at zero.
2. **+ Growth** — business-as-usual growth to the target year, a floating bar stepping up.
3. **One bar per abatement area** — each a floating bar stepping down, split into two tones within the same bar: **approved** (committed, solid) and **pending** (potential, lighter).
4. **− Removals** — permanent removals as the final floating bar stepping down.
5. **Net** — the residual, a solid bar grounded at zero, labelled **"Net-Zero"** when at or below a small threshold.

The two-tone area bar is the signature of this chart: approved and pending for the same area are one bar, divided by colour, never two separate bars.

## 4. Data inputs (built in, static)

A single configuration object. Use the example values as-is; they reference The Corporate's 2023 static baseline and an illustrative, made-up project list.

```
config = {
  base_year: 2023,
  target_year: 2045,
  baseline_tco2e: 690000,        // 2023 static footprint (Scope 1+2+3)
  growth_rate: 0.0075,           // per year, business-as-usual
  years_to_target: 22,           // 2023 → 2045
  sbti_removal_cap: 0.10,        // removals must stay under 10% of carbon debt
  net_zero_threshold: 1000       // net at or below this reads "Net-Zero"
}
```

Built-in projects (illustrative, fake):

| Project | Area | Abatement (tCO2e) | Status | Removal |
|---|---|--:|---|:--:|
| LED & HVAC retrofit | Energy efficiency | 70,000 | approved | no |
| Compressed air & controls | Energy efficiency | 40,000 | pending | no |
| Rooftop solar | Renewables | 60,000 | approved | no |
| Off-site PPA | Renewables | 80,000 | pending | no |
| Heat pumps & electric furnaces | Electrification | 90,000 | pending | no |
| Recycled aluminum & bio-polymers | Materials | 250,000 | pending | no |
| Modal shift (air to sea) | Logistics | 120,000 | approved | no |
| Supplier renewable mandate | Suppliers | 30,000 | pending | no |
| Direct air capture | Removals | 73,300 | pending | yes |

Each project carries: `name`, `area`, `abatement_tco2e`, `status` ("approved" or "pending"), `is_removal` (bool). Areas in display order: Energy efficiency, Renewables, Electrification, Materials, Logistics, Suppliers, Removals.

## 5. Calculation

```
carbon_debt      = baseline_tco2e × (1 + growth_rate) ^ years_to_target
per area (non-removal):
  approved_sum[area] = Σ abatement where area matches and status = "approved"
  pending_sum[area]  = Σ abatement where area matches and status = "pending"
removals         = Σ abatement where is_removal = true
total_reductions = Σ all non-removal abatement (approved + pending)
net              = carbon_debt − total_reductions − removals
sbti_ok          = removals / carbon_debt ≤ sbti_removal_cap
```

With the built-in data: carbon_debt ≈ 813,300; total_reductions = 740,000; removals = 73,300; **net ≈ 0**; removals are ≈ 9.0% of debt, within the 10% cap.

Bar order and heights, in tCO2e:
- Baseline: 0 → 690,000
- Growth: 690,000 → 813,300 (up)
- Each area: steps down by `approved_sum + pending_sum`, drawn as approved (solid) stacked with pending (lighter)
- Removals: steps down by `removals`
- Net: 0 → net (≈ 0)

## 6. Visual specification

- **Bridge layout.** Floating bars joined by thin step connectors that run from the top of one bar to the start of the next. Baseline and Net are grounded at zero; Growth steps up; areas and Removals step down.
- **Two-tone area bars.** Approved is the area's solid colour; pending is the same hue at roughly 45% opacity (or a hatch fill). A legend states "solid = approved (committed), light = pending (potential)."
- **Colour roles.** Baseline neutral/dark; Growth a single up colour; the abatement areas share one accent hue, told apart by their labels; Removals a distinct colour; Net green when it reads Net-Zero. If applying the SustainOS brand: ink baseline, orange growth, purple reductions, lime net.
- **Labels.** A value label on each bar in tCO2e (thousands, e.g. "−120k"). Area bars show the area name and total; the approved/pending split appears in the bar's sub-label or tooltip.
- **Title.** "Carbon trajectory: 2023 → 2045."
- **SBTi indicator.** A compact badge: "Removals 9.0% of gross, within 10% cap," turning to a warning state if removals exceed the cap.
- **Axes.** Y axis is tCO2e. The X axis is categorical, the sequence of drivers, not time. (Time is the YoY chart's job, not this one.)
- **Responsive.** Legible at ~700px wide and usable on a narrow mobile width.

## 7. Behavior

- Static reporting chart. No sliders, no editing, no scenario controls. It renders once from the built-in data.
- Optional, nice to have: hovering a bar reveals the projects inside it (name, status, abatement). No other interactivity.

## 8. Acceptance criteria

- [ ] Bars reconcile: `baseline + growth − reductions − removals = net` within rounding.
- [ ] Every area bar shows the approved/pending two-tone split correctly, as one bar.
- [ ] The Removals bar is present, and the SBTi badge shows removals as a percent of debt and flags any breach of 10%.
- [ ] Net reads "Net-Zero" when at or below the threshold, otherwise shows the residual value.
- [ ] Step connectors link each bar's top to the next bar's start, with no gaps.
- [ ] Title, value labels, and legend are present and do not overlap at 700px wide.
- [ ] Pure frontend, no network calls; renders entirely from the built-in config and project list.

## 9. Out of scope (composed in later)

- The year-on-year trajectory chart (its own spec).
- Live data from the emissions platform and the projects database.
- Project entry, the approval workflow, scenarios, authentication, and role-scoped views.
