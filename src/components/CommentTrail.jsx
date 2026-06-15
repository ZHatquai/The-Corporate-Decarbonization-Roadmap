import { formatDate } from '../lib/format'

// Immutable return-comment trail. Each entry is a 2px Ink left-border callout
// (Acid Lime is reserved for a single critical highlight — not used here).
export default function CommentTrail({ comments }) {
  if (!comments || comments.length === 0) {
    return <p className="font-sans text-[13px] text-stone">No return comments.</p>
  }
  return (
    <ul className="flex flex-col gap-4">
      {comments.map((c) => (
        <li key={c.id} className="pl-4" style={{ borderLeft: '2px solid var(--tc-ink)' }}>
          <p className="tc-label mb-1">
            Returned from {c.from_status} · {formatDate(c.created_at)}
          </p>
          <p className="tc-body">{c.comment}</p>
        </li>
      ))}
    </ul>
  )
}
