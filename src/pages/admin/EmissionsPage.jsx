import { useCallback, useEffect, useMemo, useState } from 'react'
import { listInventory, listProjects, plantScopeTotals } from '../../data/api'
import { buildMacCurve } from '../../lib/macCurve'
import { formatMac, formatTonnes, formatUSD } from '../../lib/format'
import { SCOPE_LABELS } from '../../lib/projectFields'
import Card from '../../components/brand/Card'
import Table from '../../components/brand/Table'
import { Select } from '../../components/brand/Input'
import StatusBadge from '../../components/brand/StatusBadge'
import ChartFrame, { LegendItem } from '../../components/charts/ChartFrame'
import MacCurveChart from '../../components/charts/MacCurveChart'
import { C } from '../../components/charts/chartScales'

export default function EmissionsPage() {
  const currentYear = new Date().getFullYear()
  const [invYears, setInvYears] = useState([])
  const [year, setYear] = useState(null)
  const [plantRows, setPlantRows] = useState([])
  const [plantLoading, setPlantLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Bootstrap: available years (default latest reported) + the full project list.
  useEffect(() => {
    let active = true
    Promise.all([listInventory(), listProjects()])
      .then(([inv, proj]) => {
        if (!active) return
        const reported = inv.filter((r) => r.status === 'reported').map((r) => r.year)
        const allYears = inv.map((r) => r.year).sort((a, b) => a - b)
        setInvYears(allYears.length ? allYears : [currentYear - 1])
        setYear(reported.length ? Math.max(...reported) : (allYears.length ? Math.max(...allYears) : currentYear - 1))
        setProjects(proj)
      })
      .catch((e) => active && setError(e.message ?? 'Could not load data.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [currentYear])

  const loadPlants = useCallback(async (y) => {
    if (y == null) return
    setPlantLoading(true)
    try {
      setPlantRows(await plantScopeTotals(y))
    } catch {
      setPlantRows([])
    } finally {
      setPlantLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlants(year)
  }, [year, loadPlants])

  const mac = useMemo(() => buildMacCurve(projects), [projects])
  const plantTotal = (r) => Number(r.scope1_tco2e) + Number(r.scope2_tco2e)
  const grand = plantRows.reduce(
    (acc, r) => ({ s1: acc.s1 + Number(r.scope1_tco2e), s2: acc.s2 + Number(r.scope2_tco2e) }),
    { s1: 0, s2: 0 },
  )

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="tc-label mb-3">ESG Lead · Emissions & projects</p>
        <h1 className="tc-h2">Emissions & projects</h1>
      </div>

      {error && <p className="font-sans text-[14px] text-danger">{error}</p>}

      {/* Per-plant emissions */}
      <Card elevated className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <p className="tc-subhead">Per-plant emissions — approved, location-based</p>
          <label className="flex items-center gap-2">
            <span className="tc-label">Year</span>
            <Select value={year ?? ''} onChange={(e) => setYear(Number(e.target.value))} className="w-auto">
              {invYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {plantLoading ? (
          <p className="tc-body text-stone">Loading…</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Plant</th>
                <th>Scope 1</th>
                <th>Scope 2</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {plantRows.map((r) => (
                <tr key={r.plant_id}>
                  <td className="whitespace-nowrap">
                    {r.plant_name} <span className="text-stone">({r.plant_id})</span>
                  </td>
                  <td className="whitespace-nowrap">{formatTonnes(r.scope1_tco2e)}</td>
                  <td className="whitespace-nowrap">{formatTonnes(r.scope2_tco2e)}</td>
                  <td className="whitespace-nowrap font-medium">{formatTonnes(plantTotal(r))}</td>
                </tr>
              ))}
              <tr>
                <td className="font-medium">All plants</td>
                <td className="font-medium">{formatTonnes(grand.s1)}</td>
                <td className="font-medium">{formatTonnes(grand.s2)}</td>
                <td className="font-medium">{formatTonnes(grand.s1 + grand.s2)}</td>
              </tr>
            </tbody>
          </Table>
        )}
      </Card>

      {/* MAC curve */}
      <Card>
        <ChartFrame
          title="Marginal abatement cost curve"
          subtitle="Approved + pending · width = abatement, height = MAC, ordered cheapest first"
          legend={[
            <LegendItem key="a" label="Approved" color={C.ink} />,
            <LegendItem key="p" label="Pending" color={C.stone} />,
          ]}
        >
          <MacCurveChart mac={mac} />
        </ChartFrame>
      </Card>

      {/* Project pipeline */}
      <Card elevated className="overflow-x-auto">
        <p className="tc-subhead mb-4">Project pipeline</p>
        {loading ? (
          <p className="tc-body text-stone">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="tc-body text-stone">No projects submitted yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Project</th>
                <th>Plant</th>
                <th>Area</th>
                <th>Scope</th>
                <th>Abatement</th>
                <th>MAC</th>
                <th>CAPEX</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap font-mono text-[13px]">{p.project_code}</td>
                  <td>{p.name}</td>
                  <td className="whitespace-nowrap">{p.plant_id ?? 'Global'}</td>
                  <td className="whitespace-nowrap">{p.area}</td>
                  <td className="whitespace-nowrap">{SCOPE_LABELS[p.scope] ?? p.scope}</td>
                  <td className="whitespace-nowrap">{formatTonnes(p.abatement_tco2e)}</td>
                  <td className="whitespace-nowrap">{formatMac(p.mac_usd_per_tco2e)}</td>
                  <td className="whitespace-nowrap">{formatUSD(p.capex_usd)}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
