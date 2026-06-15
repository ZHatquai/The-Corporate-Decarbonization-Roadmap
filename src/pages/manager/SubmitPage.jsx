import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { createProject, listPlants } from '../../data/api'
import ProjectForm from '../../components/manager/ProjectForm'

export default function SubmitPage() {
  const { role, plantId } = useAuth()
  const navigate = useNavigate()
  const isSourcing = role === 'sourcing_manager'
  const [plantName, setPlantName] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSourcing || !plantId) return
    let active = true
    listPlants()
      .then((plants) => {
        if (!active) return
        const p = plants.find((x) => x.plant_id === plantId)
        setPlantName(p?.plant_name ?? null)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isSourcing, plantId])

  const plantLabel = isSourcing
    ? 'Corporate / Global (all plants)'
    : plantName
      ? `${plantName} (${plantId})`
      : (plantId ?? 'Your plant')

  async function onSubmit(values) {
    setSubmitting(true)
    setError('')
    try {
      const created = await createProject({ ...values, plant_id: isSourcing ? null : plantId })
      navigate('/work/status', { state: { createdCode: created.project_code } })
    } catch (e) {
      setError(e.message ?? 'Could not submit the project. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-content">
      <p className="tc-label mb-3">Manager · Submit a project</p>
      <h1 className="tc-h2 mb-2">Submit a decarbonization project</h1>
      <p className="tc-body mb-8 text-stone">
        New projects start in evaluation. The ESG lead reviews, advances, approves, or returns
        them for restudy with a comment.
      </p>
      <ProjectForm plantLabel={plantLabel} onSubmit={onSubmit} submitting={submitting} formError={error} />
    </div>
  )
}
