// Restrained status pill: uppercase tracked label, hairline border, text-only color.
// No fills, no Acid Lime (lime is reserved for >=black-container highlights only).
const STATUS_STYLES = {
  // dr_projects workflow
  evaluation: { label: 'Evaluation', color: 'var(--tc-stone)', border: 'var(--tc-stone)' },
  pending: { label: 'Pending', color: 'var(--tc-ink)', border: 'var(--tc-ink)' },
  approved: { label: 'Approved', color: '#2E7D32', border: '#2E7D32' },
  restudy: { label: 'Restudy', color: '#C0392B', border: '#C0392B' },
  // dr_annual_inventory
  base_year: { label: 'Base year', color: 'var(--tc-ink)', border: 'var(--tc-ink)' },
  reported: { label: 'Reported', color: 'var(--tc-ink)', border: 'var(--tc-stone)' },
}

export default function StatusBadge({ status, className = '' }) {
  const s = STATUS_STYLES[status] ?? { label: status ?? '—', color: 'var(--tc-ink)', border: 'var(--tc-stone)' }
  return (
    <span
      className={`inline-flex items-center rounded-none px-2 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] ${className}`}
      style={{ color: s.color, border: `0.5px solid ${s.border}`, background: 'transparent' }}
    >
      {s.label}
    </span>
  )
}
