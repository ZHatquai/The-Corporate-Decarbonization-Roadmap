// Shared chart helpers. Brand chart-colour roles (build plan FE-6):
//   Ink = baseline / approved / actuals · Stone = growth / pending / BAU
//   Acid Lime = ONLY inside a black container (net-zero marker, SBTi-OK badge)
export const C = {
  ink: '#000000',
  stone: '#B6B09F',
  linen: '#EAE4D5',
  chalk: '#F2F2F2',
  lime: '#C8F135',
  grid: 'rgba(182,176,159,0.45)',
  danger: '#C0392B',
}

// Linear scale d -> r with .invert.
export function scaleLinear([d0, d1], [r0, r1]) {
  const span = d1 - d0 || 1
  const fn = (v) => r0 + ((v - d0) / span) * (r1 - r0)
  fn.invert = (p) => d0 + ((p - r0) / (r1 - r0)) * span
  return fn
}

// "Nice" tick step + ticks from 0 up to maxValue (~target divisions).
export function axisTicks(maxValue, target = 4) {
  if (!(maxValue > 0)) return { step: 1, ticks: [0] }
  const rough = maxValue / target
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const ticks = []
  for (let t = 0; t <= maxValue + 1e-6; t += step) ticks.push(Math.round(t))
  return { step, ticks }
}

// Split a label into up to two short lines for an x-axis tick.
export function wrapLabel(label, maxLen = 11) {
  const text = String(label)
  if (text.length <= maxLen) return [text]
  const words = text.split(' ')
  if (words.length === 1) return [text]
  const lines = ['', '']
  let i = 0
  for (const w of words) {
    if (i === 0 && (lines[0] + ' ' + w).trim().length <= maxLen) lines[0] = (lines[0] + ' ' + w).trim()
    else {
      i = 1
      lines[1] = (lines[1] + ' ' + w).trim()
    }
  }
  return lines[1] ? [lines[0], lines[1]] : [lines[0]]
}
