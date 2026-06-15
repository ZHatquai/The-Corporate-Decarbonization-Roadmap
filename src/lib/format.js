// Display formatters. Numerals for data (brand Section 8). Real minus sign (−)
// in compact chart labels to match the chart specs (e.g. "−120k").
const MINUS = '−'

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

export function formatInt(v) {
  return nf0.format(Math.round(Number(v) || 0))
}

// Full tonnes with thousands separators, e.g. "690,000".
export function formatTonnes(v) {
  return formatInt(v)
}

// Compact thousands for chart labels: 690000 -> "690k", 813300 -> "813k".
export function formatK(v, { signed = false } = {}) {
  const n = Number(v) || 0
  const k = n / 1000
  const abs = Math.abs(k)
  const digits = abs < 100 ? 1 : 0
  const body = `${nf1.format(Math.abs(k) === 0 ? 0 : Number(abs.toFixed(digits)))}k`
  if (n < 0) return `${MINUS}${body}`
  if (signed && n > 0) return `+${body}`
  return body
}

// USD: "$1,200,000".
export function formatUSD(v) {
  const n = Number(v) || 0
  const sign = n < 0 ? MINUS : ''
  return `${sign}$${nf0.format(Math.abs(Math.round(n)))}`
}

// Compact USD for tight labels: 1_200_000 -> "$1.2M", -15 -> "−$15".
export function formatUSDCompact(v) {
  const n = Number(v) || 0
  const sign = n < 0 ? MINUS : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${sign}$${nf1.format(abs / 1_000_000)}M`
  if (abs >= 1_000) return `${sign}$${nf1.format(abs / 1_000)}k`
  return `${sign}$${nf0.format(abs)}`
}

// MAC value, USD per tCO2e: "$120", "−$15".
export function formatMac(v) {
  const n = Math.round(Number(v) || 0)
  const sign = n < 0 ? MINUS : ''
  return `${sign}$${nf0.format(Math.abs(n))}`
}

export function formatPercent(v, digits = 1) {
  return `${((Number(v) || 0) * 100).toFixed(digits)}%`
}

// Date as "DD Month YYYY" (brand Section 8: no ordinals).
const df = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
export function formatDate(value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : df.format(d)
}
