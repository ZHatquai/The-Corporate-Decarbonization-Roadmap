// Fixed roadmap configuration for this build (not user-editable — spec Section 9).
export const ROADMAP_CONFIG = {
  base_year: 2023,
  target_year: 2045,
  growth_rate: 0.0075, // BAU growth per year
  sbti_removal_cap: 0.1, // removals must stay <= 10% of grown carbon debt
  net_zero_threshold: 1000, // net at or below this reads "Net-Zero" (tCO2e)
}

export const yearsToTarget = (c = ROADMAP_CONFIG) => c.target_year - c.base_year

// Display order for the waterfall's abatement-area bars (waterfall spec §3/§6 plus
// the 'Grid' value added by dr_projects.area). Removals are pulled out by the
// is_removal flag into their own bar, not by this list.
export const AREA_ORDER = [
  'Energy efficiency',
  'Renewables',
  'Electrification',
  'Materials',
  'Logistics',
  'Suppliers',
  'Grid',
  'Removals',
]
