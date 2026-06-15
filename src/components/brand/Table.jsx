// Thin wrapper applying the brand .tc-table styling (zebra rows, hairline rules,
// uppercase tracked headers). Consumers use plain thead/tbody/tr/th/td inside.
export default function Table({ className = '', children, ...props }) {
  return (
    <table className={`tc-table ${className}`} {...props}>
      {children}
    </table>
  )
}
