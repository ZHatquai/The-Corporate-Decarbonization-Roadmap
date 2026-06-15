import { formatDate, formatMac, formatTonnes, formatUSD } from '../lib/format'
import { SCOPE_LABELS } from '../lib/projectFields'
import StatusBadge from './brand/StatusBadge'
import CommentTrail from './CommentTrail'

export function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b-hair py-2.5" style={{ borderColor: 'var(--tc-border)' }}>
      <span className="tc-label">{label}</span>
      <span className="font-sans text-[14px] font-light text-ink">{children}</span>
    </div>
  )
}

// Shared read-only project detail: header, field rows, return-comment trail.
// `children` is an actions slot (resubmit for managers; advance/approve/return for admin).
export default function ProjectDetail({ project, comments, commentsLoading, showPlant = true, children }) {
  if (!project) return null
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="tc-label mb-1">{project.project_code}</p>
          <h2 className="font-display text-[24px] leading-tight text-ink">{project.name}</h2>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {showPlant && <DetailRow label="Plant">{project.plant_id ?? 'Corporate / Global'}</DetailRow>}
      <DetailRow label="Area · Scope">
        {project.area} · {SCOPE_LABELS[project.scope] ?? `Scope ${project.scope}`}
      </DetailRow>
      <DetailRow label="Description">{project.description}</DetailRow>
      <DetailRow label="Annual abatement">
        {formatTonnes(project.abatement_tco2e)} tCO2e/yr{project.is_removal ? ' · permanent removal' : ''}
      </DetailRow>
      <DetailRow label="Start year">{project.start_year}</DetailRow>
      <DetailRow label="CAPEX · Annual OPEX">
        {formatUSD(project.capex_usd)} · {formatUSD(project.opex_annual_usd)}
      </DetailRow>
      <DetailRow label="MAC">{formatMac(project.mac_usd_per_tco2e)} / tCO2e</DetailRow>
      <DetailRow label="Submitted">{formatDate(project.created_at)}</DetailRow>

      <div className="mt-6">
        <p className="tc-subhead mb-3">Return comments</p>
        {commentsLoading ? (
          <p className="font-sans text-[13px] text-stone">Loading…</p>
        ) : (
          <CommentTrail comments={comments} />
        )}
      </div>

      {children}
    </div>
  )
}
