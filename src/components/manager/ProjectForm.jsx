import { useState } from 'react'
import Field from '../brand/Field'
import { Input, Textarea, Select } from '../brand/Input'
import Button from '../brand/Button'
import { AREA_OPTIONS, SCOPE_OPTIONS } from '../../lib/projectFields'
import { ROADMAP_CONFIG } from '../../lib/config'

const EMPTY = {
  name: '',
  area: '',
  scope: '',
  description: '',
  abatement_tco2e: '',
  start_year: '',
  is_removal: false,
  capex_usd: '',
  opex_annual_usd: '',
  mac_usd_per_tco2e: '',
}

const toNum = (x) => (x === '' || x === null || Number.isNaN(Number(x)) ? null : Number(x))

// Project submission form. Plant is fixed from the submitter's role (read-only here);
// project_code and status are system-assigned. `initial` pre-fills for restudy edits.
export default function ProjectForm({
  plantLabel,
  initial,
  onSubmit,
  submitting,
  formError,
  submitLabel = 'Submit project',
}) {
  const [v, setV] = useState({ ...EMPTY, ...(initial ?? {}) })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function validate() {
    const er = {}
    if (!v.name.trim()) er.name = 'Required'
    if (!v.area) er.area = 'Required'
    if (!v.scope) er.scope = 'Required'
    if (!v.description.trim()) er.description = 'Required'
    const ab = toNum(v.abatement_tco2e)
    if (ab === null || ab <= 0) er.abatement_tco2e = 'Enter a positive number'
    const sy = toNum(v.start_year)
    if (sy === null || !Number.isInteger(sy) || sy < ROADMAP_CONFIG.base_year || sy > ROADMAP_CONFIG.target_year)
      er.start_year = `Year ${ROADMAP_CONFIG.base_year}–${ROADMAP_CONFIG.target_year}`
    const cx = toNum(v.capex_usd)
    if (cx === null || cx < 0) er.capex_usd = 'Enter a number ≥ 0'
    const ox = toNum(v.opex_annual_usd)
    if (ox === null || ox < 0) er.opex_annual_usd = 'Enter a number ≥ 0'
    if (toNum(v.mac_usd_per_tco2e) === null) er.mac_usd_per_tco2e = 'Enter a number'
    return er
  }

  function handle(e) {
    e.preventDefault()
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return
    onSubmit({
      name: v.name.trim(),
      area: v.area,
      scope: v.scope,
      description: v.description.trim(),
      abatement_tco2e: Number(v.abatement_tco2e),
      start_year: Number(v.start_year),
      is_removal: !!v.is_removal,
      capex_usd: Number(v.capex_usd),
      opex_annual_usd: Number(v.opex_annual_usd),
      mac_usd_per_tco2e: Number(v.mac_usd_per_tco2e),
    })
  }

  return (
    <form onSubmit={handle} className="flex flex-col gap-6">
      <Field label="Plant" hint="Set from your role — not editable on the form.">
        <div className="rounded-none border-hair border-stone bg-chalk px-3.5 py-2.5 font-sans text-[14px] text-ink">
          {plantLabel}
        </div>
      </Field>

      <Field label="Project name" htmlFor="pf-name" required error={errors.name}>
        <Input id="pf-name" value={v.name} onChange={set('name')} placeholder="e.g. Rooftop solar" />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Abatement area" htmlFor="pf-area" required error={errors.area}>
          <Select id="pf-area" value={v.area} onChange={set('area')}>
            <option value="">Select…</option>
            {AREA_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="GHG scope" htmlFor="pf-scope" required error={errors.scope}>
          <Select id="pf-scope" value={v.scope} onChange={set('scope')}>
            <option value="">Select…</option>
            {SCOPE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description" htmlFor="pf-desc" required error={errors.description}>
        <Textarea
          id="pf-desc"
          value={v.description}
          onChange={set('description')}
          placeholder="What the project does and how it abates emissions."
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Annual abatement (tCO2e/yr)" htmlFor="pf-ab" required error={errors.abatement_tco2e}>
          <Input id="pf-ab" inputMode="decimal" value={v.abatement_tco2e} onChange={set('abatement_tco2e')} placeholder="60000" />
        </Field>
        <Field label="Start year" htmlFor="pf-sy" required error={errors.start_year}>
          <Input id="pf-sy" inputMode="numeric" value={v.start_year} onChange={set('start_year')} placeholder="2027" />
        </Field>
        <Field label="CAPEX (USD)" htmlFor="pf-cx" required error={errors.capex_usd}>
          <Input id="pf-cx" inputMode="decimal" value={v.capex_usd} onChange={set('capex_usd')} placeholder="1200000" />
        </Field>
        <Field label="Annual OPEX (USD)" htmlFor="pf-ox" required error={errors.opex_annual_usd}>
          <Input id="pf-ox" inputMode="decimal" value={v.opex_annual_usd} onChange={set('opex_annual_usd')} placeholder="40000" />
        </Field>
        <Field
          label="MAC (USD/tCO2e)"
          htmlFor="pf-mac"
          required
          error={errors.mac_usd_per_tco2e}
          hint="May be negative for cost-saving projects."
        >
          <Input id="pf-mac" inputMode="decimal" value={v.mac_usd_per_tco2e} onChange={set('mac_usd_per_tco2e')} placeholder="-15" />
        </Field>
        <Field label="Permanent removal?">
          <label className="flex h-full items-center gap-3 font-sans text-[14px] font-light text-ink">
            <input
              type="checkbox"
              checked={v.is_removal}
              onChange={set('is_removal')}
              className="h-4 w-4 rounded-none accent-ink"
            />
            This project permanently removes carbon
          </label>
        </Field>
      </div>

      {formError && <p className="font-sans text-[13px] text-danger">{formError}</p>}

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
