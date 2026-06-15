// Temporary page body used while routing is in place but the feature is built
// in a later FE step. Replaced as each phase lands.
export default function Placeholder({ phase, title, blurb }) {
  return (
    <div>
      {phase && <p className="tc-label mb-3">{phase}</p>}
      <h1 className="tc-h2">{title}</h1>
      <p className="tc-body mt-4 max-w-content text-stone">
        {blurb ?? 'This view is built in a later step of the roadmap build.'}
      </p>
    </div>
  )
}
