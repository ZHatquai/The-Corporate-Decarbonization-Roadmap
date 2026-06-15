// Marginal Abatement Cost curve: each project a bar, width = abatement_tco2e,
// height = mac_usd_per_tco2e, ordered ascending by MAC (cheapest / most negative
// first). Default included set matches the charts: approved + pending.
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

export function buildMacCurve(projects, { statuses = ['approved', 'pending'] } = {}) {
  const items = projects
    .filter((p) => statuses.includes(p.status))
    .map((p) => ({
      id: p.id,
      project_code: p.project_code,
      name: p.name,
      area: p.area,
      status: p.status,
      is_removal: p.is_removal,
      abatement: num(p.abatement_tco2e),
      mac: num(p.mac_usd_per_tco2e),
    }))
    .filter((p) => p.abatement > 0)
    .sort((a, b) => a.mac - b.mac || b.abatement - a.abatement)

  // Cumulative x positions so bars sit side by side along the abatement axis.
  let x = 0
  const bars = items.map((p) => {
    const bar = { ...p, x0: x, x1: x + p.abatement }
    x += p.abatement
    return bar
  })

  const macs = bars.map((b) => b.mac)
  return {
    bars,
    totalAbatement: x,
    minMac: macs.length ? Math.min(...macs) : 0,
    maxMac: macs.length ? Math.max(...macs) : 0,
  }
}
