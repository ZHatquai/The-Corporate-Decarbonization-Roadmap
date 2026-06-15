import { C, axisTicks, scaleLinear, wrapLabel } from './chartScales'
import { formatK } from '../../lib/format'

const W = 940
const H = 470
const M = { top: 36, right: 18, bottom: 80, left: 68 }

// Cumulative level after a step (where the bridge connector sits going into the next bar).
const levelAfter = (s) => (s.type === 'baseline' || s.type === 'growth' ? s.top : s.bottom)

export default function WaterfallChart({ waterfall }) {
  const steps = waterfall.steps
  const n = steps.length
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom
  const yMax = Math.max(waterfall.carbonDebt, waterfall.baseline) * 1.06 || 1
  const y = scaleLinear([0, yMax], [M.top + plotH, M.top])
  const { ticks } = axisTicks(yMax)

  const band = plotW / n
  const barW = Math.min(band * 0.6, 62)
  const cx = (i) => M.left + band * (i + 0.5)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 680 }} role="img"
      aria-label="Decarbonization waterfall from base year to net-zero">
      <defs>
        <pattern id="dr-removals-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill={C.chalk} />
          <line x1="0" y1="0" x2="0" y2="7" stroke={C.ink} strokeWidth="3" />
        </pattern>
      </defs>

      {/* gridlines + y labels */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.left} y1={y(t)} x2={M.left + plotW} y2={y(t)} stroke={C.grid} strokeWidth="0.5" />
          <text x={M.left - 10} y={y(t) + 3} textAnchor="end" fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif">
            {formatK(t)}
          </text>
        </g>
      ))}
      {/* y axis title */}
      <text x={16} y={M.top - 14} fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif" letterSpacing="0.12em">
        tCO2e
      </text>

      {/* connectors */}
      {steps.slice(0, n - 1).map((s, i) => {
        const ly = y(levelAfter(s))
        return (
          <line key={`c-${s.key}`} x1={cx(i) + barW / 2} y1={ly} x2={cx(i + 1) - barW / 2} y2={ly}
            stroke={C.stone} strokeWidth="0.75" strokeDasharray="2 2" />
        )
      })}

      {/* bars */}
      {steps.map((s, i) => {
        const x = cx(i) - barW / 2
        const topY = y(s.top)
        const botY = y(s.bottom)
        const barTop = Math.min(topY, botY)
        const barH = Math.max(2, Math.abs(botY - topY))
        const labelY = barTop - 8

        let body
        if (s.type === 'baseline') {
          body = <rect x={x} y={y(s.top)} width={barW} height={Math.max(2, y(0) - y(s.top))} fill={C.ink} />
        } else if (s.type === 'growth') {
          body = <rect x={x} y={barTop} width={barW} height={barH} fill={C.stone} />
        } else if (s.type === 'area') {
          const approvedH = (s.approved / (s.value || 1)) * barH
          body = (
            <g>
              <rect x={x} y={barTop} width={barW} height={Math.max(0, approvedH)} fill={C.ink} />
              <rect x={x} y={barTop + approvedH} width={barW} height={Math.max(0, barH - approvedH)} fill={C.stone} />
            </g>
          )
        } else if (s.type === 'removals') {
          body = (
            <g>
              <rect x={x} y={barTop} width={barW} height={barH} fill="url(#dr-removals-hatch)" stroke={C.ink} strokeWidth="0.5" />
            </g>
          )
        } else {
          // net
          const groundY = y(0)
          const ntop = y(Math.max(s.value, 0))
          body = <rect x={x} y={Math.min(ntop, groundY)} width={barW} height={Math.max(2, Math.abs(groundY - ntop))} fill={C.ink} />
        }

        const labelText =
          s.type === 'growth'
            ? formatK(s.value, { signed: true })
            : s.type === 'area' || s.type === 'removals'
              ? formatK(-s.value)
              : s.type === 'net'
                ? s.isNetZero ? 'Net-Zero' : formatK(s.value)
                : formatK(s.value)

        const xlines = wrapLabel(s.label)
        return (
          <g key={s.key}>
            {body}
            <text x={cx(i)} y={labelY} textAnchor="middle" fontSize="10.5"
              fontWeight={s.type === 'net' && s.isNetZero ? 700 : 400}
              fill={C.ink} fontFamily="DM Sans, sans-serif">
              {labelText}
            </text>
            {xlines.map((ln, k) => (
              <text key={k} x={cx(i)} y={M.top + plotH + 18 + k * 12} textAnchor="middle" fontSize="9.5"
                fill={C.stone} fontFamily="DM Sans, sans-serif">
                {ln}
              </text>
            ))}
          </g>
        )
      })}

      {/* baseline axis */}
      <line x1={M.left} y1={y(0)} x2={M.left + plotW} y2={y(0)} stroke={C.ink} strokeWidth="0.75" />
    </svg>
  )
}
