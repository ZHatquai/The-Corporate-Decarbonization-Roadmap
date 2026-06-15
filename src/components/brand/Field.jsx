// Labeled form-control wrapper: uppercase tracked label, optional hint, error text
// (error uses the brand danger color, text only). Wrap any Input/Select/Textarea.
export default function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className = '',
  children,
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="tc-label">
          {label}
          {required && <span className="text-ink"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="font-sans text-[12px] leading-snug text-stone">{hint}</p>}
      {error && (
        <p className="font-sans text-[12px] leading-snug text-danger">{error}</p>
      )}
    </div>
  )
}
