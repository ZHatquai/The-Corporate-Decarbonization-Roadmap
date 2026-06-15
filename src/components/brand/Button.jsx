// Square, uppercase, tracked button. Primary = Ink fill / Chalk text;
// Secondary = transparent with hairline Ink border.
export default function Button({
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-sans font-medium uppercase tracking-[0.1em] text-[13px] px-7 py-3 rounded-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-ink text-chalk hover:bg-[#1a1a1a]',
    secondary: 'bg-transparent text-ink border-hair border-ink hover:bg-chalk',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
