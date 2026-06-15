import Logo from './brand/Logo'

export default function LoadingScreen({ message = 'Loading' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-chalk">
      <Logo size={32} />
      <p className="tc-label" aria-live="polite">
        {message}…
      </p>
    </div>
  )
}
