import { useCallback, useEffect, useMemo, useState } from 'react'
import { advanceProject, approveProject, listComments, listProjects, returnProject } from '../../data/api'
import { formatMac, formatTonnes } from '../../lib/format'
import Card from '../../components/brand/Card'
import Table from '../../components/brand/Table'
import Button from '../../components/brand/Button'
import StatusBadge from '../../components/brand/StatusBadge'
import { Textarea } from '../../components/brand/Input'
import ProjectDetail from '../../components/ProjectDetail'

const FILTERS = [
  { key: 'action', label: 'Needs action', match: (s) => s === 'evaluation' || s === 'pending' },
  { key: 'approved', label: 'Approved', match: (s) => s === 'approved' },
  { key: 'restudy', label: 'Restudy', match: (s) => s === 'restudy' },
  { key: 'all', label: 'All', match: () => true },
]

export default function QueuePage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('action')
  const [selectedId, setSelectedId] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [returning, setReturning] = useState(false)
  const [returnComment, setReturnComment] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProjects(await listProjects())
    } catch (e) {
      setError(e.message ?? 'Could not load projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const c = {}
    for (const f of FILTERS) c[f.key] = projects.filter((p) => f.match(p.status)).length
    return c
  }, [projects])

  const visible = projects.filter((p) => FILTERS.find((f) => f.key === filter).match(p.status))
  const selected = projects.find((p) => p.id === selectedId) ?? null

  const loadComments = useCallback(async (id) => {
    setCommentsLoading(true)
    try {
      setComments(await listComments(id))
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  function select(id) {
    setSelectedId(id)
    setReturning(false)
    setReturnComment('')
    setActionError('')
    setComments([])
    loadComments(id)
  }

  async function runAction(fn) {
    if (!selected) return
    setBusy(true)
    setActionError('')
    try {
      await fn(selected.id)
      await load()
      await loadComments(selected.id)
      setReturning(false)
      setReturnComment('')
    } catch (e) {
      setActionError(e.message ?? 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  function onConfirmReturn() {
    if (!returnComment.trim()) {
      setActionError('A return comment is required.')
      return
    }
    const comment = returnComment.trim()
    runAction((id) => returnProject(id, comment))
  }

  return (
    <div>
      <p className="tc-label mb-3">ESG Lead · Approval queue</p>
      <h1 className="tc-h2 mb-6">Approval queue</h1>

      <div className="mb-6 flex flex-wrap gap-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`no-underline font-sans text-[12px] font-medium uppercase tracking-[0.1em] pb-1 ${
              filter === f.key ? 'text-ink border-b-hair border-ink' : 'text-stone hover:text-ink'
            }`}
          >
            {f.label} ({counts[f.key] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="tc-body text-stone">Loading…</p>
      ) : error ? (
        <p className="font-sans text-[14px] text-danger">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Card elevated className="overflow-x-auto">
            {visible.length === 0 ? (
              <p className="tc-body text-stone">No projects in this view.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Project</th>
                    <th>Plant</th>
                    <th>Area</th>
                    <th>Abatement</th>
                    <th>MAC</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => select(p.id)}
                      className={`cursor-pointer ${selectedId === p.id ? 'bg-linen' : ''}`}
                    >
                      <td className="whitespace-nowrap font-mono text-[13px]">{p.project_code}</td>
                      <td>{p.name}</td>
                      <td className="whitespace-nowrap">{p.plant_id ?? 'Global'}</td>
                      <td className="whitespace-nowrap">{p.area}</td>
                      <td className="whitespace-nowrap">{formatTonnes(p.abatement_tco2e)}</td>
                      <td className="whitespace-nowrap">{formatMac(p.mac_usd_per_tco2e)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <div>
            {selected ? (
              <Card>
                <ProjectDetail project={selected} comments={comments} commentsLoading={commentsLoading}>
                  <div className="mt-6">
                    {actionError && <p className="mb-3 font-sans text-[13px] text-danger">{actionError}</p>}

                    {(selected.status === 'evaluation' || selected.status === 'pending') && !returning && (
                      <div className="flex flex-wrap gap-3">
                        {selected.status === 'evaluation' && (
                          <Button onClick={() => runAction(advanceProject)} disabled={busy}>
                            {busy ? 'Working…' : 'Advance to pending'}
                          </Button>
                        )}
                        {selected.status === 'pending' && (
                          <Button onClick={() => runAction(approveProject)} disabled={busy}>
                            {busy ? 'Working…' : 'Approve'}
                          </Button>
                        )}
                        <Button variant="secondary" onClick={() => setReturning(true)} disabled={busy}>
                          Return for restudy
                        </Button>
                      </div>
                    )}

                    {returning && (
                      <div className="flex flex-col gap-3">
                        <p className="tc-subhead">Return for restudy</p>
                        <Textarea
                          rows={3}
                          value={returnComment}
                          onChange={(e) => setReturnComment(e.target.value)}
                          placeholder="Explain what the submitter should revise. A comment is required."
                        />
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={onConfirmReturn} disabled={busy}>
                            {busy ? 'Returning…' : 'Confirm return'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setReturning(false)
                              setReturnComment('')
                              setActionError('')
                            }}
                            disabled={busy}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {selected.status === 'approved' && (
                      <p className="tc-body text-stone">Approved — committed to the roadmap.</p>
                    )}
                    {selected.status === 'restudy' && (
                      <p className="tc-body text-stone">
                        Returned to the submitter for restudy. Awaiting their resubmission.
                      </p>
                    )}
                  </div>
                </ProjectDetail>
              </Card>
            ) : (
              <Card>
                <p className="tc-body text-stone">Select a project to review and act on it.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
