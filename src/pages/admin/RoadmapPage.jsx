import { useRoadmapData } from '../../hooks/useRoadmapData'
import { formatPercent, formatTonnes } from '../../lib/format'
import Card from '../../components/brand/Card'
import ChartFrame, { LegendItem } from '../../components/charts/ChartFrame'
import WaterfallChart from '../../components/charts/WaterfallChart'
import TrajectoryChart from '../../components/charts/TrajectoryChart'
import SbtiBadge from '../../components/charts/SbtiBadge'
import { C } from '../../components/charts/chartScales'

function Stat({ label, value, sub }) {
  return (
    <div className="border-hair border-stone bg-chalk p-4">
      <p className="tc-label mb-1">{label}</p>
      <p className="font-display text-[22px] leading-none text-ink">{value}</p>
      {sub && <p className="mt-1 font-sans text-[11px] text-stone">{sub}</p>}
    </div>
  )
}

export default function RoadmapPage() {
  const { loading, error, roadmap } = useRoadmapData()

  return (
    <div>
      <p className="tc-label mb-3">ESG Lead · Roadmap</p>
      <h1 className="tc-h2 mb-6">Carbon trajectory: 2023 → 2045</h1>

      {loading ? (
        <p className="tc-body text-stone">Loading the live roadmap…</p>
      ) : error ? (
        <p className="font-sans text-[14px] text-danger">{error}</p>
      ) : (
        <div className="flex flex-col gap-8">
          {/* summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Base year (2023)" value={`${formatTonnes(roadmap.baseline)}`} sub="tCO2e · Scope 1+2+3" />
            <Stat label="Grown carbon debt" value={`${formatTonnes(roadmap.carbonDebt)}`} sub="BAU to 2045" />
            <Stat
              label="Net at 2045"
              value={roadmap.waterfall.isNetZero ? 'Net-Zero' : formatTonnes(roadmap.waterfall.net)}
              sub={roadmap.waterfall.isNetZero ? 'at or below 1,000 tCO2e' : 'tCO2e residual'}
            />
            <Stat
              label="Removals share"
              value={formatPercent(roadmap.waterfall.sbtiPct)}
              sub={`of gross · cap ${formatPercent(roadmap.config.sbti_removal_cap, 0)}`}
            />
          </div>

          {/* Waterfall */}
          <Card>
            <ChartFrame
              title="Decarbonization waterfall"
              subtitle="Base year → grown debt → abatement by area → removals → net"
              legend={[
                <LegendItem key="b" label="Baseline / approved" color={C.ink} />,
                <LegendItem key="g" label="Growth / pending" color={C.stone} />,
                <LegendItem key="r" label="Removals" color={C.ink} />,
              ]}
            >
              <WaterfallChart waterfall={roadmap.waterfall} />
            </ChartFrame>
            <div className="mt-4">
              <SbtiBadge pct={roadmap.waterfall.sbtiPct} ok={roadmap.waterfall.sbtiOk} cap={roadmap.config.sbti_removal_cap} />
            </div>
          </Card>

          {/* Trajectory */}
          <Card>
            <ChartFrame
              title="Path to net-zero: 2023 → 2045"
              subtitle="Committed (approved) vs target (approved + pending + removals), with measured actuals"
              legend={[
                <LegendItem key="a" label="Actuals" color={C.ink} kind="line" />,
                <LegendItem key="t" label="Target" color={C.ink} kind="line" />,
                <LegendItem key="c" label="Committed" color={C.stone} kind="line" />,
                <LegendItem key="bau" label="BAU" color={C.stone} kind="line" dashed />,
                <LegendItem key="gap" label="Decision gap" color={C.stone} />,
              ]}
            >
              <TrajectoryChart trajectory={roadmap.trajectory} config={roadmap.config} />
            </ChartFrame>
          </Card>
        </div>
      )}
    </div>
  )
}
