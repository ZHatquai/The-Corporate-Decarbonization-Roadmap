import { C, scaleLinear } from './chartScales'
import { formatMac, formatTonnes } from '../../lib/format'

const W = 940
const H = 420
const M = { top: 24, right: 18, bottom: 56, left: 70 }

// Marginal Abatement Cost curve. Each bar: width = abatement, height = MAC,
// ordered ascending by MAC (negative/cost-saving first). Ink = approved,
// Stone = pending. Zero line emphasised so cost-saving bars read below it.
export default function MacCurveChart({ mac }) {
  const { bars, totalAbatement, minMac, maxMac } = mac
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom

  if (!bars.length) {
    return <p className="tc-body text-stone">No approved or pending projects yet — the MAC curve appears once projects exist.</p>
  }

  const yLo = Math.min(minMac, 0)
  const yHi = Math.max(maxMac, 0)
  const pad = (yHi - yLo || 1) * 0.1
  const x = scaleLinear([0, totalAbatement || 1], [M.left, M.left + plotW])
  const y = scaleLinear([yLo - pad, yHi + pad], [M.top + plotH, M.top])

  const yTicks = Array.from(new Set([yLo, yLo / 2, 0, yHi / 2, yHi].map((v) => Math.round(v)))).sort((a, b) => a - b)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 680 }} role="img" aria-label="Marginal abatement cost curve">
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={M.left} y1={y(t)} x2={M.left + plotW} y2={y(t)} stroke={t === 0 ? C.ink : C.grid} strokeWidth={t === 0 ? 0.75 : 0.5} />
          <text x={M.left - 10} y={y(t) + 3} textAnchor="end" fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif">
            {formatMac(t)}
          </text>
        </g>
      ))}

      {bars.map((b) => {
        const bx = x(b.x0)
        const bw = Math.max(1, x(b.x1) - x(b.x0) - 1)
        const yTop = y(Math.max(b.mac, 0))
        const yBot = y(Math.min(b.mac, 0))
        return (
          <rect key={b.id ?? b.project_code ?? b.name} x={bx} y={yTop} width={bw} height={Math.max(1, yBot - yTop)}
            fill={b.status === 'approved' ? C.ink : C.stone}>
            <title>
              {b.name} · {formatMac(b.mac)}/tCO2e · {formatTonnes(b.abatement)} tCO2e · {b.status}
            </title>
          </rect>
        )
      })}

      {/* axes */}
      <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + plotH} stroke={C.stone} strokeWidth="0.5" />
      <text x={16} y={M.top - 8} fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif" letterSpacing="0.1em">
        USD/tCO2e
      </text>
      <text x={M.left + plotW / 2} y={H - 14} textAnchor="middle" fontSize="10" fill={C.stone} fontFamily="DM Sans, sans-serif" letterSpacing="0.1em">
        Cumulative abatement (tCO2e) →
      </text>
    </svg>
  )
}
