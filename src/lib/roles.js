// Role helpers shared across routing and UI.
export const ROLE_LABELS = {
  esg_admin: 'ESG Lead',
  plant_manager: 'Plant Manager',
  sourcing_manager: 'Sourcing Manager',
}

export const isManager = (role) => role === 'plant_manager' || role === 'sourcing_manager'

// Where each role lands after sign-in (spec Section 8).
export function homePathForRole(role) {
  if (role === 'esg_admin') return '/app/roadmap'
  if (isManager(role)) return '/work/status'
  return '/access'
}
