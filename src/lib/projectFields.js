// Form option lists, matching the dr_projects CHECK constraints.
export const AREA_OPTIONS = [
  'Energy efficiency',
  'Electrification',
  'Renewables',
  'Materials',
  'Logistics',
  'Suppliers',
  'Removals',
  'Grid',
]

export const SCOPE_OPTIONS = [
  { value: '1', label: 'Scope 1' },
  { value: '2', label: 'Scope 2' },
  { value: '1 & 2', label: 'Scope 1 & 2' },
  { value: '3', label: 'Scope 3' },
]

export const SCOPE_LABELS = {
  1: 'Scope 1',
  2: 'Scope 2',
  '1 & 2': 'Scope 1 & 2',
  3: 'Scope 3',
}
