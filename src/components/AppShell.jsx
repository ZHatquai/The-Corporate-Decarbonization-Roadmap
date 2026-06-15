import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { isManager, ROLE_LABELS } from '../lib/roles'
import Logo from './brand/Logo'

const ADMIN_NAV = [
  { to: '/app/roadmap', label: 'Roadmap' },
  { to: '/app/emissions', label: 'Emissions & projects' },
  { to: '/app/inventory', label: 'Annual inventory' },
  { to: '/app/queue', label: 'Approval queue' },
  { to: '/app/settings/users', label: 'Users' },
]

const MANAGER_NAV = [
  { to: '/work/status', label: 'My projects' },
  { to: '/work/submit', label: 'Submit a project' },
]

function navClass({ isActive }) {
  return [
    'no-underline font-sans text-[12px] font-medium uppercase tracking-[0.1em] pb-1 transition-colors',
    isActive ? 'text-ink border-b-hair border-ink' : 'text-stone hover:text-ink',
  ].join(' ')
}

export default function AppShell() {
  const { role, email, signOut } = useAuth()
  const nav = isManager(role) ? MANAGER_NAV : ADMIN_NAV

  return (
    <div className="flex min-h-screen flex-col bg-chalk">
      <header className="border-b-hair border-stone bg-chalk">
        <div className="mx-auto flex max-w-page flex-col gap-4 px-6 py-4 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Logo size={26} />
            <span className="hidden tc-subhead sm:inline">Decarbonization Roadmap</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="tc-label hidden md:inline" title={email ?? undefined}>
              {ROLE_LABELS[role] ?? role}
            </span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-stone md:inline" />
            <button
              type="button"
              onClick={signOut}
              className="no-underline font-sans text-[12px] font-medium uppercase tracking-[0.1em] text-stone hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-page px-6 sm:px-10">
          <div className="flex gap-6 overflow-x-auto pb-3">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-page flex-1 px-6 py-10 sm:px-10">
        <Outlet />
      </main>

      <footer className="border-t-hair border-stone">
        <div className="mx-auto max-w-page px-6 py-6 sm:px-10">
          <p className="tc-label">The Corporate · Internal · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
