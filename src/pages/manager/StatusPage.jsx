import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { listComments, listProjects, resubmitProject } from '../../data/api'
import { formatTonnes } from '../../lib/format'
import Card from '../../components/brand/Card'
import Table from '../../components/brand/Table'
import Button from '../../components/brand/Button'
import StatusBadge from '../../components/brand/StatusBadge'
import ProjectDetail from '../../components/ProjectDetail'

export default function StatusPage() {
  const location = useLocation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [resubmitting, setResubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [createdCode, setCreatedCode] = useState(location.state?.createdCode ?? null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProjects(await listProjects())
    } catch (e) {
      setError(e.message ?? 'Could not load your projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
    setActionError('')
    setSelectedId(id)
    setComments([])
    loadComments(id)
  }

  async function onResubmit() {
    if (!selected) return
    setResubmitting(true)
    setActionError('')
    try {
      await resubmitProject(selected.id)
      await load()
      await loadComments(selected.id)
    } catch (e) {
      setActionError(e.message ?? 'Could not resubmit.')
    } finally {
      setResubmitting(false)
    }
  }

  return (
    <div>
      <p className="tc-label mb-3">Manager · My projects</p>
      <h1 className="tc-h2 mb-6">My projects</h1>

      {createdCode && (
        <div className="mb-6 border-hair border-ink bg-linen px-4 py-3">
          <p className="font-sans text-[14px] text-ink">
            Project <span className="font-medium">{createdCode}</span> submitted. It is now in
            evaluation.
          </p>
          <button type="button" onClick={() => setCreatedCode(null)} className="mt-1 font-sans text-[12px] text-stone">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="tc-body text-stone">Loading…</p>
      ) : error ? (
        <p className="font-sans text-[14px] text-danger">{error}</p>
      ) : projects.length === 0 ? (
        <Card>
          <p className="tc-body">
            You have not submitted any projects yet. Use “Submit a project” to add your first one.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Card elevated className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Project</th>
                  <th>Area</th>
                  <th>Abatement</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => select(p.id)}
                    className={`cursor-pointer ${selectedId === p.id ? 'bg-linen' : ''}`}
                  >
                    <td className="whitespace-nowrap font-mono text-[13px]">{p.project_code}</td>
                    <td>{p.name}</td>
                    <td className="whitespace-nowrap">{p.area}</td>
                    <td className="whitespace-nowrap">{formatTonnes(p.abatement_tco2e)}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <div>
            {selected ? (
              <Card>
                <ProjectDetail project={selected} comments={comments} commentsLoading={commentsLoading}>
                  {selected.status === 'restudy' && (
                    <div className="mt-6">
                      <p className="tc-body mb-3 text-stone">
                        Revise the project, then resubmit it to return it to evaluation.
                      </p>
                      {actionError && <p className="mb-3 font-sans text-[13px] text-danger">{actionError}</p>}
                      <Button onClick={onResubmit} disabled={resubmitting}>
                        {resubmitting ? 'Resubmitting…' : 'Resubmit for evaluation'}
                      </Button>
                    </div>
                  )}
                </ProjectDetail>
              </Card>
            ) : (
              <Card>
                <p className="tc-body text-stone">Select a project to see its details and any return comments.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
