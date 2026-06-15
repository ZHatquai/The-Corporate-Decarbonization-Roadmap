// The single shared engine behind both charts (waterfall-chart-spec.md and
// yoy-trajectory-chart-spec.md). Pure functions, no I/O. The only difference from
// the chart specs is the data source: live tables instead of static config.
//
// Both charts use ONLY 'approved' (committed) and 'pending' (potential) projects;
// 'evaluation' and 'restudy' are excluded. The engine filters defensively.
import { ROADMAP_CONFIG, AREA_ORDER, yearsToTarget } from './config.js'

const isIncluded = (p) => p.status === 'approved' || p.status === 'pending'
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// --- Waterfall: the 2045 end-state decomposed by driver -------------------------
export function computeWaterfall(baseline, projects, config = ROADMAP_CONFIG) {
  const base = num(baseline)
  const ytt = yearsToTarget(config)
  const carbonDebt = base * Math.pow(1 + config.growth_rate, ytt)
  const proj = projects.filter(isIncluded)

  // Group non-removal projects by area; collect removals separately.
  const areaMap = new Map()
  let approvedTotal = 0
  let pendingTotal = 0
  let removalsApproved = 0
  let removalsPending = 0
  for (const p of proj) {
    const amt = num(p.abatement_tco2e)
    if (p.is_removal) {
      if (p.status === 'approved') removalsApproved += amt
      else removalsPending += amt
      continue
    }
    const area = p.area || 'Other'
    if (!areaMap.has(area)) areaMap.set(area, { area, approved: 0, pending: 0 })
    const g = areaMap.get(area)
    if (p.status === 'approved') {
      g.approved += amt
      approvedTotal += amt
    } else {
      g.pending += amt
      pendingTotal += amt
    }
  }

  const removals = removalsApproved + removalsPending
  const totalReductions = approvedTotal + pendingTotal // non-removal only
  const net = carbonDebt - totalReductions - removals
  const sbtiPct = carbonDebt > 0 ? removals / carbonDebt : 0
  const sbtiOk = sbtiPct <= config.sbti_removal_cap
  const isNetZero = net <= config.net_zero_threshold

  const orderIndex = (a) => {
    const i = AREA_ORDER.indexOf(a)
    return i === -1 ? AREA_ORDER.length : i
  }
  const areas = [...areaMap.values()]
    .filter((g) => g.approved + g.pending > 0)
    .sort((x, y) => orderIndex(x.area) - orderIndex(y.area) || x.area.localeCompare(y.area))

  // Floating-bar geometry: top/bottom are cumulative tCO2e levels.
  const steps = []
  steps.push({ key: 'baseline', type: 'baseline', label: 'Baseline', top: base, bottom: 0, value: base })
  steps.push({ key: 'growth', type: 'growth', label: '+ Growth', top: carbonDebt, bottom: base, value: carbonDebt - base })
  let running = carbonDebt
  for (const g of areas) {
    const total = g.approved + g.pending
    steps.push({
      key: `area:${g.area}`,
      type: 'area',
      label: g.area,
      top: running,
      bottom: running - total,
      value: total,
      approved: g.approved,
      pending: g.pending,
    })
    running -= total
  }
  if (removals > 0) {
    steps.push({
      key: 'removals',
      type: 'removals',
      label: 'Removals',
      top: running,
      bottom: running - removals,
      value: removals,
      approved: removalsApproved,
      pending: removalsPending,
    })
    running -= removals
  }
  steps.push({ key: 'net', type: 'net', label: isNetZero ? 'Net-Zero' : 'Net', top: net, bottom: 0, value: net, isNetZero })

  return {
    carbonDebt,
    baseline: base,
    areas,
    approvedTotal,
    pendingTotal,
    removals,
    removalsApproved,
    removalsPending,
    totalReductions,
    net,
    isNetZero,
    sbtiPct,
    sbtiOk,
    steps,
  }
}

// Linear ramp from 0 at start_year to 1 at target_year, clamped to [0,1].
function ramp(year, startYear, targetYear) {
  const denom = targetYear - startYear
  if (denom <= 0) return year >= startYear ? 1 : 0
  return Math.max(0, Math.min(1, (year - startYear) / denom))
}

// --- Trajectory: the same model swept across every year -------------------------
export function computeTrajectory(baseline, projects, config = ROADMAP_CONFIG) {
  const base = num(baseline)
  const proj = projects.filter(isIncluded)
  const points = []
  for (let y = config.base_year; y <= config.target_year; y++) {
    const bau = base * Math.pow(1 + config.growth_rate, y - config.base_year)
    let committedRed = 0
    let targetRed = 0
    for (const p of proj) {
      const delivered = num(p.abatement_tco2e) * ramp(y, num(p.start_year) || config.base_year, config.target_year)
      targetRed += delivered // every approved + pending project (incl. removals)
      if (p.status === 'approved' && !p.is_removal) committedRed += delivered
    }
    points.push({ year: y, bau, committed: bau - committedRed, target: bau - targetRed })
  }
  return points
}

// --- Combined entry point for the Roadmap view ----------------------------------
export function computeRoadmap({
  baseline,
  projects = [],
  actuals = [],
  config = ROADMAP_CONFIG,
  currentYear = new Date().getFullYear(),
}) {
  const waterfall = computeWaterfall(baseline, projects, config)
  const points = computeTrajectory(baseline, projects, config)
  // Actuals: measured points, only for complete (past) years; never the partial current year.
  const completeActuals = actuals
    .filter((a) => Number(a.year) < currentYear && Number.isFinite(Number(a.value)))
    .map((a) => ({ year: Number(a.year), value: Number(a.value) }))
    .sort((a, b) => a.year - b.year)
  const nz = points.find((p) => p.target <= config.net_zero_threshold)
  return {
    config,
    baseline: waterfall.baseline,
    carbonDebt: waterfall.carbonDebt,
    waterfall,
    trajectory: {
      points,
      actuals: completeActuals,
      netZeroYear: nz ? nz.year : null,
      endsNetZero: waterfall.isNetZero,
    },
  }
}
