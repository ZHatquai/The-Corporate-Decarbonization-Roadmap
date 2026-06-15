import { useCallback, useEffect, useMemo, useState } from 'react'
import { listInventory, previewInventory, publishInventory } from '../../data/api'
import { formatDate, formatTonnes } from '../../lib/format'
import { ROADMAP_CONFIG } from '../../lib/config'
import Card from '../../components/brand/Card'
import Table from '../../components/brand/Table'
import Button from '../../components/brand/Button'
import Field from '../../components/brand/Field'
import { Input, Select } from '../../components/brand/Input'
import StatusBadge from '../../components/brand/StatusBadge'

const toNum = (x) => (x === '' || x === null || Number.isNaN(Number(x)) ? null : Number(x))

export default function InventoryPage() {
  const currentYear = new Date().getFullYear()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [year, setYear] = useState(currentYear - 1)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [s3, setS3] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [justPublished, setJustPublished] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setRows(await listInventory())
    } catch (e) {
      setLoadError(e.message ?? 'Could not load the inventory.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Selectable years: 2023 through the current year (plus any already published beyond).
  const years = useMemo(() => {
    const maxRow = rows.reduce((m, r) => Math.max(m, r.year), currentYear)
    const out = []
    for (let y = ROADMAP_CONFIG.base_year; y <= maxRow; y++) out.push(y)
    return out
  }, [rows, currentYear])

  const existing = rows.find((r) => r.year === year) ?? null

  // Live approved Scope 1/2 for the chosen year; prefill Scope 3 from any existing row.
  useEffect(() => {
    let active = true
    setPreviewLoading(true)
    setPublishError('')
    previewInventory(year)
      .then((p) => {
        if (!active) return
        setPreview({ s1: Number(p.scope1_tco2e) || 0, s2: Number(p.scope2_tco2e) || 0 })
      })
      .catch((e) => {
        if (active) setPublishError(e.message ?? 'Could not load the live Scope 1/2 figures.')
      })
      .finally(() => {
        if (active) setPreviewLoading(false)
      })
    return () => {
      active = false
    }
  }, [year, rows])

  // Prefill Scope 3 when switching to a year that already has a published row.
  useEffect(() => {
    setS3(existing ? String(existing.scope3_tco2e) : '')
  }, [year]) // eslint-disable-line react-hooks/exhaustive-deps

  const s3Num = toNum(s3)
  const s1 = preview?.s1 ?? 0
  const s2 = preview?.s2 ?? 0
  const total = s3Num === null ? null : s1 + s2 + s3Num
  const canPublish = !previewLoading && s3Num !== null && s3Num >= 0 && !publishing

  async function onPublish() {
    if (!canPublish) {
      setPublishError('Enter a Scope 3 value of 0 or more.')
      return
    }
    setPublishing(true)
    setPublishError('')
    try {
      const result = await publishInventory(year, s3Num)
      const r = Array.isArray(result) ? result[0] : result
      setJustPublished({ year, total: r?.total_tco2e ?? total, status: r?.status })
      await load()
    } catch (e) {
      setPublishError(e.message ?? 'Publish failed.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div>
      <p className="tc-label mb-3">ESG Lead · Annual inventory</p>
      <h1 className="tc-h2 mb-6">Annual inventory</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Publish / freeze panel */}
        <Card>
          <p className="tc-subhead mb-4">Publish a reporting year</p>
          <p className="tc-body mb-6 text-stone">
            Scope 1 and 2 are aggregated live from the platform’s approved location-based data.
            Enter Scope 3; the total is computed and the year is frozen on publish. Re-publishing
            overwrites the row.
          </p>

          <div className="flex flex-col gap-5">
            <Field label="Reporting year" htmlFor="inv-year">
              <Select id="inv-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                    {y === ROADMAP_CONFIG.base_year ? ' — base year' : ''}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div className="border-hair border-stone bg-chalk p-3">
                <p className="tc-label mb-1">Scope 1 (live)</p>
                <p className="font-sans text-[15px] text-ink">
                  {previewLoading ? '…' : `${formatTonnes(s1)}`}
                </p>
              </div>
              <div className="border-hair border-stone bg-chalk p-3">
                <p className="tc-label mb-1">Scope 2 (live)</p>
                <p className="font-sans text-[15px] text-ink">
                  {previewLoading ? '…' : `${formatTonnes(s2)}`}
                </p>
              </div>
            </div>

            <Field label="Scope 3 (tCO2e)" htmlFor="inv-s3" hint="Entered by the ESG lead.">
              <Input
                id="inv-s3"
                inputMode="decimal"
                value={s3}
                onChange={(e) => setS3(e.target.value)}
                placeholder="e.g. 489340"
              />
            </Field>

            <div className="border-hair border-ink p-4">
              <p className="tc-label mb-1">Total (computed)</p>
              <p className="font-display text-[28px] leading-none text-ink">
                {total === null ? '—' : `${formatTonnes(total)}`}
                <span className="ml-2 font-sans text-[13px] font-light text-stone">tCO2e</span>
              </p>
            </div>

            {publishError && <p className="font-sans text-[13px] text-danger">{publishError}</p>}
            {justPublished && (
              <p className="font-sans text-[13px] text-success">
                Published {justPublished.year} — total {formatTonnes(justPublished.total)} tCO2e
                {justPublished.status ? ` (${justPublished.status})` : ''}.
              </p>
            )}

            <div>
              <Button onClick={onPublish} disabled={!canPublish}>
                {publishing ? 'Publishing…' : existing ? 'Re-publish (overwrite)' : 'Publish & freeze'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Published history */}
        <Card elevated className="overflow-x-auto">
          <p className="tc-subhead mb-4">Published inventory</p>
          {loading ? (
            <p className="tc-body text-stone">Loading…</p>
          ) : loadError ? (
            <p className="font-sans text-[14px] text-danger">{loadError}</p>
          ) : rows.length === 0 ? (
            <p className="tc-body text-stone">No years published yet.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Scope 1</th>
                  <th>Scope 2</th>
                  <th>Scope 3</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.year}>
                    <td className="whitespace-nowrap font-mono text-[13px]">{r.year}</td>
                    <td className="whitespace-nowrap">{formatTonnes(r.scope1_tco2e)}</td>
                    <td className="whitespace-nowrap">{formatTonnes(r.scope2_tco2e)}</td>
                    <td className="whitespace-nowrap">{formatTonnes(r.scope3_tco2e)}</td>
                    <td className="whitespace-nowrap font-medium">{formatTonnes(r.total_tco2e)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <p className="tc-label mt-4">
            {rows.length > 0 && rows[rows.length - 1].published_at
              ? `Last published ${formatDate(rows[rows.length - 1].published_at)}`
              : ''}
          </p>
        </Card>
      </div>
    </div>
  )
}
