import { C, axisTicks, scaleLinear } from './chartScales'
import { formatK } from '../../lib/format'

const W = 940
const H = 470
const M = { top: 30, right: 96, bottom: 52, left: 68 }

export default function TrajectoryChart({ trajectory, config }) {
  const { points, actuals } = trajectory
  const base = config.base_year
  const target = config.target_year
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom

  const yMax = Math.max(...points.map((p) => p.bau)) * 1.06 || 1
  const x = scaleLinear([base, target], [M.left, M.left + plotW])
  const clamp = (v) => Math.max(0, Math.min(yMax, v))
  const yRaw = scaleLinear([0, yMax], [M.top + plotH, M.top])
  const y = (v) => yRaw(clamp(v))
  const { ticks } = axisTicks(yMax)

  const line = (key) => points.map((p) => `${x(p.year)},${y(p[key])}`).join(' ')
  const bandPath =
    points.map((p) => `${x(p.year)},${y(p.committed)}`).join(' ') +
    ' ' +
    [...points].reverse().map((p) => `${x(p.year)},${y(p.target)}`).join(' ')

  const xTicks = []
  for (let yr = base; yr <= target; yr++) if (yr === base || yr === target || yr % 5 === 0) xTicks.push(yr)

  const last = points[points.length - 1]
  const nzX = x(target)
  const nzY = y(last.target)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 680 }} role="img"
      aria-label="Year-on-year emissions trajectory from base year to target year">
      {/* gridlines + y labels */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.left} y1={yRaw(t)} x2={M.left + plotW} y2={yRaw(t)} stroke={C.grid} strokeWidth="0.5" />
          <text x={M.left - 10} y={yRaw(t) + 3} textAnchor="end" fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif">
            {formatK(t)}
          </text>
        </g>
      ))}
      <text x={16} y={M.top - 12} fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif" letterSpacing="0.12em">
        tCO2e
      </text>

      {/* x ticks */}
      {xTicks.map((yr) => (
        <text key={yr} x={x(yr)} y={M.top + plotH + 20} textAnchor="middle" fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif">
          {yr}
        </text>
      ))}

      {/* decision-gap band (committed -> target) */}
      <polygon points={bandPath} fill={C.stone} opacity="0.18" />
      <text x={x(target) - 6} y={(y(last.committed) + y(last.target)) / 2} textAnchor="end" fontSize="9.5" fill={C.stone} fontFamily="DM Sans, sans-serif">
        decision gap
      </text>

      {/* BAU reference (faint dashed) */}
      <polyline points={line('bau')} fill="none" stroke={C.stone} strokeWidth="1.25" strokeDasharray="5 4" opacity="0.6" />
      {/* committed (approved only) */}
      <polyline points={line('committed')} fill="none" stroke={C.stone} strokeWidth="2" />
      {/* target (approved + pending + removals) */}
      <polyline points={line('target')} fill="none" stroke={C.ink} strokeWidth="2.5" />

      {/* actuals overlay (measured, complete years) */}
      {actuals.length > 0 && (
        <polyline points={actuals.map((a) => `${x(a.year)},${y(a.value)}`).join(' ')} fill="none" stroke={C.ink} strokeWidth="2" />
      )}
      {actuals.map((a) => (
        <circle key={a.year} cx={x(a.year)} cy={y(a.value)} r="3.5" fill={C.ink} />
      ))}

      {/* end-of-line labels */}
      <text x={M.left + plotW + 8} y={y(last.committed) + 3} fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif">
        Committed
      </text>
      <text x={M.left + plotW + 8} y={y(last.target) - 6} fontSize="10" fontWeight="500" fill={C.ink} fontFamily="DM Sans, sans-serif">
        Target
      </text>

      {/* endpoint marker. Net-zero = lime dot inside a black square (a permitted lime
          use); otherwise a neutral Ink dot with the residual value (no false claim). */}
      {trajectory.endsNetZero ? (
        <>
          <rect x={nzX - 5} y={nzY - 5} width="10" height="10" fill={C.ink} />
          <circle cx={nzX} cy={nzY} r="2.6" fill={C.lime} />
          <text x={nzX + 8} y={nzY + 14} fontSize="10" fontWeight="500" fill={C.ink} fontFamily="DM Sans, sans-serif">
            Net-Zero {target}
          </text>
        </>
      ) : (
        <>
          <circle cx={nzX} cy={nzY} r="3" fill={C.ink} />
          <text x={nzX + 8} y={nzY + 14} fontSize="10" fontWeight="500" fill={C.ink} fontFamily="DM Sans, sans-serif">
            {formatK(last.target)} · {target}
          </text>
        </>
      )}

      {/* axes */}
      <line x1={M.left} y1={yRaw(0)} x2={M.left + plotW} y2={yRaw(0)} stroke={C.ink} strokeWidth="0.75" />
    </svg>
  )
}
