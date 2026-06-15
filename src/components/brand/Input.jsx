// Square form controls with hairline Stone border, focus to Ink. White background.
export const inputClass =
  'w-full rounded-none border-hair border-stone bg-white px-3.5 py-2.5 font-sans font-light text-[14px] text-ink placeholder:text-stone outline-none focus:border-ink disabled:opacity-50'

export function Input({ className = '', ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />
}

export function Textarea({ className = '', rows = 4, ...props }) {
  return <textarea rows={rows} className={`${inputClass} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  )
}
