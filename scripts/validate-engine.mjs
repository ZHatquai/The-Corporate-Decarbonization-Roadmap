// Dependency-free check of the shared engine against the chart specs' worked
// example (waterfall-chart-spec.md §5 + yoy-trajectory-chart-spec.md §4).
// Run:  node scripts/validate-engine.mjs
import { computeRoadmap } from '../src/lib/trajectoryEngine.js'
import { buildMacCurve } from '../src/lib/macCurve.js'

const BASELINE = 690000

// Built-in projects from the specs (abatement, status, removal, start year).
const projects = [
  { name: 'LED & HVAC retrofit', area: 'Energy efficiency', abatement_tco2e: 70000, status: 'approved', is_removal: false, start_year: 2024 },
  { name: 'Compressed air & controls', area: 'Energy efficiency', abatement_tco2e: 40000, status: 'pending', is_removal: false, start_year: 2026 },
  { name: 'Rooftop solar', area: 'Renewables', abatement_tco2e: 60000, status: 'approved', is_removal: false, start_year: 2025 },
  { name: 'Off-site PPA', area: 'Renewables', abatement_tco2e: 80000, status: 'pending', is_removal: false, start_year: 2027 },
  { name: 'Heat pumps & electric furnaces', area: 'Electrification', abatement_tco2e: 90000, status: 'pending', is_removal: false, start_year: 2028 },
  { name: 'Recycled aluminum & bio-polymers', area: 'Materials', abatement_tco2e: 250000, status: 'pending', is_removal: false, start_year: 2032 },
  { name: 'Modal shift (air to sea)', area: 'Logistics', abatement_tco2e: 120000, status: 'approved', is_removal: false, start_year: 2024 },
  { name: 'Supplier renewable mandate', area: 'Suppliers', abatement_tco2e: 30000, status: 'pending', is_removal: false, start_year: 2028 },
  { name: 'Direct air capture', area: 'Removals', abatement_tco2e: 73300, status: 'pending', is_removal: true, start_year: 2040 },
  // excluded from charts — must not affect anything:
  { name: 'Noise project (evaluation)', area: 'Grid', abatement_tco2e: 999999, status: 'evaluation', is_removal: false, start_year: 2025 },
  { name: 'Noise project (restudy)', area: 'Grid', abatement_tco2e: 999999, status: 'restudy', is_removal: false, start_year: 2025 },
]

const actuals = [
  { year: 2023, value: 690000 },
  { year: 2024, value: 683000 },
  { year: 2025, value: 673000 },
  { year: 2026, value: 999 }, // incomplete current year — must be dropped
]

const r = computeRoadmap({ baseline: BASELINE, projects, actuals, currentYear: 2026 })
const w = r.waterfall
const pts = r.trajectory.points
const at = (y) => pts.find((p) => p.year === y)

let failures = 0
function check(label, ok, detail) {
  const tag = ok ? 'PASS' : 'FAIL'
  if (!ok) failures++
  console.log(`[${tag}] ${label}${detail ? ` — ${detail}` : ''}`)
}
const approx = (a, b, tol) => Math.abs(a - b) <= tol

// --- Waterfall acceptance ---
check('carbon_debt ≈ 813,300', approx(w.carbonDebt, 813300, 200), `got ${Math.round(w.carbonDebt)}`)
check('total_reductions = 740,000', w.totalReductions === 740000, `got ${w.totalReductions}`)
check('removals = 73,300', w.removals === 73300, `got ${w.removals}`)
check('net ≈ 0 (within threshold)', Math.abs(w.net) <= 1000 && w.isNetZero, `got ${Math.round(w.net)}, isNetZero=${w.isNetZero}`)
check('removals ≈ 9.0% of debt, within cap', approx(w.sbtiPct, 0.09, 0.002) && w.sbtiOk, `got ${(w.sbtiPct * 100).toFixed(2)}%`)
check('reconcile baseline+growth−reductions−removals = net', approx(w.baseline + (w.carbonDebt - w.baseline) - w.totalReductions - w.removals, w.net, 0.001))
check(
  'evaluation/restudy excluded (6 area bars, no Grid)',
  w.areas.length === 6 && !w.areas.some((a) => a.area === 'Grid'),
  `area bars: ${w.areas.map((a) => a.area).join(', ')}`,
)
check('Energy efficiency bar = 70k approved + 40k pending', (() => { const a = w.areas.find((x) => x.area === 'Energy efficiency'); return a && a.approved === 70000 && a.pending === 40000 })())

// --- Trajectory acceptance ---
check('both lines start at baseline in 2023', at(2023).committed === BASELINE && at(2023).target === BASELINE, `committed=${at(2023).committed}, target=${at(2023).target}`)
check('target reaches net-zero (≈0) at 2045', Math.abs(at(2045).target) <= 1000, `got ${Math.round(at(2045).target)}`)
check('committed ends above zero at 2045', at(2045).committed > 1000, `got ${Math.round(at(2045).committed)}`)
check('committed > target at 2045 (decision gap)', at(2045).committed > at(2045).target)
check('BAU rises above baseline by 2045', at(2045).bau > BASELINE, `got ${Math.round(at(2045).bau)}`)
check('sweep covers 2023..2045 inclusive', pts.length === 23, `got ${pts.length}`)
check('actuals = 3 complete years (2026 dropped)', r.trajectory.actuals.length === 3, `years: ${r.trajectory.actuals.map((a) => a.year).join(',')}`)

// --- MAC curve ---
const mac = buildMacCurve(projects)
check('MAC bars = 9 (approved+pending only)', mac.bars.length === 9, `got ${mac.bars.length}`)
check('MAC bars sorted ascending by MAC', mac.bars.every((b, i, arr) => i === 0 || arr[i - 1].mac <= b.mac))

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)
