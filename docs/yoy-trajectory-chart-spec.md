# Product Spec — Decarbonization YoY Trajectory Chart

**Standalone component, companion to the waterfall chart spec.** Same self-contained, static, Tier 1 style. It deliberately reuses the waterfall's model and adds only the time dimension. Where the waterfall is the bridge at the 2045 end-state, this is the same engine plotted year by year.

---

## 1. Summary

A static line chart of emissions per year from the base year to the target year, declining as projects come online toward net-zero. It draws two planned paths, **committed** (approved projects only) and **target** (approved plus pending plus removals), and overlays the **measured actuals** for the complete years to date. The band between committed and target is the decision still to be made.

## 2. Classification

- **Tier 1.** Data model **D1** (hardcoded). Access **A1** (no login). Pure frontend, no backend, no auth. (Same as the waterfall.)

## 3. Shared model (reused, not redefined)

This chart runs on the **same engine as the waterfall chart spec**: `baseline_tco2e`, `growth_rate`, `years_to_target`, and the project list (`name, area, abatement_tco2e, status, is_removal`). Those are defined in the waterfall spec and are not repeated here. This spec adds only what the time view needs.

## 4. What the time view adds to the model

- **`start_year` per project** — the year a project begins delivering. The waterfall ignores this; the trajectory needs it.
- **A ramp** — each project ramps linearly from 0 at its `start_year` to full abatement at `target_year`. (A step at `start_year` is an allowed simplification.)
- **Actuals** — measured total emissions for each complete year to date, plotted as an overlay. The full-year rule: only complete years appear; a partial current year is never plotted.

Built-in additions (illustrative, paired to the waterfall's project list):

| Project | start_year |
|---|--:|
| LED & HVAC retrofit (approved) | 2024 |
| Modal shift (air to sea) (approved) | 2024 |
| Rooftop solar (approved) | 2025 |
| Compressed air & controls (pending) | 2026 |
| Off-site PPA (pending) | 2027 |
| Heat pumps & electric furnaces (pending) | 2028 |
| Supplier renewable mandate (pending) | 2028 |
| Recycled aluminum & bio-polymers (pending) | 2032 |
| Direct air capture (pending, removal) | 2040 |

Actuals (complete years, measured):

| Year | Emissions (tCO2e) |
|---|--:|
| 2023 | 690,000 |
| 2024 | 683,000 |
| 2025 | 673,000 |

## 5. Calculation (the time sweep)

For each year `Y` from `base_year` to `target_year`:

```
bau[Y]        = baseline_tco2e × (1 + growth_rate) ^ (Y − base_year)
ramp[p,Y]     = clamp( (Y − start_year[p]) / (target_year − start_year[p]), 0, 1 )
committed[Y]  = bau[Y] − Σ (approved, non-removal)         abatement[p] × ramp[p,Y]
target[Y]     = bau[Y] − Σ (approved + pending + removals) abatement[p] × ramp[p,Y]
```

- At `base_year`, both lines equal the baseline (no project has ramped yet).
- At `target_year`, `target` reaches net-zero (≈ 0) and `committed` lands above zero (approved alone does not close the gap).
- **Actuals** are independent measured points, not computed from the model. They are plotted only for complete years, and the comparison against the lines is the on-track / behind / ahead story.

## 6. Visual specification

- **Line chart.** X axis = years (`base_year` … `target_year`). Y axis = tCO2e.
- **Target line**: solid accent, descending to ≈ 0 at `target_year`, with a net-zero marker at the endpoint.
- **Committed line**: lighter or dashed, descending, ending above zero.
- **The band between committed and target**: shaded, labelled "pending potential / decision gap."
- **Actuals**: distinct markers and a solid segment over the complete years, visually compared against the lines.
- **Optional BAU reference**: a faint dashed rising line (baseline grown, no action) that makes growth visible over time, the time-view twin of the waterfall's growth bar.
- **Legend**: actuals, committed, target, (BAU). **Title**: "Path to net-zero: 2023 → 2045." Axis labels present.
- If applying the SustainOS brand: lime/green target, purple committed, ink actuals, faint orange BAU.
- Responsive; legible at ~700px wide and on a narrow mobile width.

## 7. Behavior

- Static reporting chart. Renders once from the built-in data. No sliders, no editing.
- Optional, nice to have: hovering a year shows a readout (year → committed, target, actual). No other interactivity.

## 8. Acceptance criteria

- [ ] Both planned lines start at the baseline in the base year.
- [ ] The target line reaches net-zero (≈ 0) at the target year; the committed line ends above zero.
- [ ] The committed-to-target band is shaded and labelled as the decision gap.
- [ ] Actuals appear only for complete years and are visually distinct from the planned lines.
- [ ] The net-zero endpoint is marked; legend, title, and axis labels are present and do not overlap at 700px.
- [ ] Pure frontend, no network calls; renders from the built-in config, project list, start years, and actuals.

## 9. Relationship to the waterfall (for the composition step)

Same engine, two readings. The waterfall is `target` at the single year `target_year`, decomposed by driver. This chart is the same model swept across every year. When the two specs are composed, both read the one shared engine: the waterfall answers "what closes the gap," the trajectory answers "when." Nothing in the engine is duplicated, which is the point.

## 10. Out of scope (composed in later)

- Live data from the emissions platform and the projects database.
- Project entry, the approval workflow, scenarios, authentication, and role-scoped views.
- The shared engine's full definition, which lives in the waterfall spec and is not restated here.
