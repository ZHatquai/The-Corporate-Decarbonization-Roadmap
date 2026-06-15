import { formatPercent } from '../../lib/format'

// SBTi removal-cap indicator. When within cap: black container with Acid Lime
// label (a permitted lime use). When breached: danger-red, no lime, no fill.
export default function SbtiBadge({ pct, ok, cap = 0.1 }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-2 bg-ink px-3 py-1.5">
        <span
          className="font-sans text-[10px] font-medium uppercase tracking-[0.14em]"
          style={{ color: 'var(--tc-lime)' }}
        >
          SBTi OK
        </span>
        <span className="font-sans text-[11px] font-light text-chalk">
          Removals {formatPercent(pct)} of gross, within {Math.round(cap * 100)}% cap
        </span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 border-hair px-3 py-1.5" style={{ borderColor: '#C0392B' }}>
      <span className="font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-danger">SBTi breach</span>
      <span className="font-sans text-[11px] font-light text-ink">
        Removals {formatPercent(pct)} of gross, exceeds {Math.round(cap * 100)}% cap
      </span>
    </span>
  )
}
