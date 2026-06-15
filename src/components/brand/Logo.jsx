// The Corporate logo: boxed "C" monogram + spaced wordmark.
// Brand: box solid black (or Chalk when inverted), monogram DM Sans Medium,
// wordmark DM Sans Light, uppercase, letter-spacing 0.12em. Square box, no radius.
export default function Logo({ variant = 'full', invert = false, size = 28, className = '' }) {
  const boxBg = invert ? 'var(--tc-chalk)' : 'var(--tc-ink)'
  const monoColor = invert ? 'var(--tc-ink)' : 'var(--tc-chalk)'
  const wordColor = invert ? 'var(--tc-chalk)' : 'var(--tc-ink)'

  const box = (
    <span
      className="inline-flex items-center justify-center font-sans font-medium select-none"
      style={{ background: boxBg, color: monoColor, width: size, height: size, fontSize: size * 0.5, lineHeight: 1 }}
      aria-hidden="true"
    >
      C
    </span>
  )

  if (variant === 'mono') return <span className={className} aria-label="The Corporate">{box}</span>

  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="The Corporate">
      {box}
      <span
        className="font-sans font-light uppercase whitespace-nowrap"
        style={{ color: wordColor, letterSpacing: '0.12em', fontSize: Math.max(12, size * 0.46) }}
      >
        The Corporate
      </span>
    </span>
  )
}
