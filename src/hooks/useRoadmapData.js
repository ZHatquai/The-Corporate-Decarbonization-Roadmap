import { useEffect, useState } from 'react'
import { listInventory, listProjects } from '../data/api'
import { computeRoadmap } from '../lib/trajectoryEngine'

// Loads the live inputs and runs the shared engine:
//  - baseline = the base_year inventory total (2023)
//  - actuals  = published inventory totals (base_year + reported)
//  - projects = dr_projects (engine keeps only approved + pending)
export function useRoadmapData() {
  const [state, setState] = useState({ loading: true, error: '', roadmap: null })

  useEffect(() => {
    let active = true
    Promise.all([listInventory(), listProjects()])
      .then(([inv, projects]) => {
        if (!active) return
        const baseRow = inv.find((r) => r.status === 'base_year')
        if (!baseRow) {
          setState({ loading: false, error: 'No base-year inventory row found. Publish 2023 first.', roadmap: null })
          return
        }
        const baseline = Number(baseRow.total_tco2e)
        const actuals = inv.map((r) => ({ year: r.year, value: Number(r.total_tco2e) }))
        const roadmap = computeRoadmap({ baseline, projects, actuals })
        setState({ loading: false, error: '', roadmap })
      })
      .catch((e) => {
        if (active) setState({ loading: false, error: e.message ?? 'Could not load roadmap data.', roadmap: null })
      })
    return () => {
      active = false
    }
  }, [])

  return state
}
