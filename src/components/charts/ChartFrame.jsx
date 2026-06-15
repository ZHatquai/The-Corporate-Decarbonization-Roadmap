// Wrapper for a chart: title, optional subtitle, a horizontally-scrollable SVG
// area (keeps labels legible on mobile), and a legend row.
export default function ChartFrame({ title, subtitle, legend, children }) {
  return (
    <figure className="m-0">
      <figcaption className="mb-3">
        <h2 className="font-display text-[24px] leading-tight text-ink">{title}</h2>
        {subtitle && <p className="tc-label mt-1">{subtitle}</p>}
      </figcaption>
      <div className="overflow-x-auto">{children}</div>
      {legend && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{legend}</div>}
    </figure>
  )
}

// Small legend entry: a swatch (line / fill / hatch) + label.
export function LegendItem({ label, color = '#000', kind = 'fill', dashed = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="22" height="12" aria-hidden="true">
        {kind === 'line' ? (
          <line
            x1="0"
            y1="6"
            x2="22"
            y2="6"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={dashed ? '4 3' : undefined}
          />
        ) : (
          <rect x="1" y="1" width="20" height="10" fill={color} />
        )}
      </svg>
      <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-stone">{label}</span>
    </span>
  )
}
