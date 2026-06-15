// Surface card. Default = Linen with strong hairline; elevated = White with faint hairline.
// Square corners, no shadow (brand uses hairlines for depth).
export default function Card({ elevated = false, as: Tag = 'div', className = '', children, ...props }) {
  const surface = elevated
    ? 'bg-white border-hair'
    : 'bg-linen border-hair border-stone'
  return (
    <Tag
      className={`rounded-none p-6 ${surface} ${className}`}
      style={elevated ? { borderColor: 'var(--tc-border)' } : undefined}
      {...props}
    >
      {children}
    </Tag>
  )
}
