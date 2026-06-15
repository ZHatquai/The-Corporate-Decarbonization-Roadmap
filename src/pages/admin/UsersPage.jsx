import { useCallback, useEffect, useState } from 'react'
import { inviteUser, listPlants, listUsers } from '../../data/api'
import { ROLE_LABELS } from '../../lib/roles'
import Card from '../../components/brand/Card'
import Table from '../../components/brand/Table'
import Button from '../../components/brand/Button'
import Field from '../../components/brand/Field'
import { Input, Select } from '../../components/brand/Input'

const ROLE_OPTIONS = ['esg_admin', 'plant_manager', 'sourcing_manager']

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('plant_manager')
  const [plantId, setPlantId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [u, p] = await Promise.all([listUsers(), listPlants()])
      setUsers(u)
      setPlants(p)
    } catch (e) {
      setLoadError(e.message ?? 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onInvite(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const clean = email.trim().toLowerCase()
    if (!clean) {
      setError('Enter an email address.')
      return
    }
    if (role === 'plant_manager' && !plantId) {
      setError('Choose a plant for a plant manager.')
      return
    }
    setBusy(true)
    try {
      const result = await inviteUser({
        email: clean,
        role,
        plant_id: role === 'plant_manager' ? plantId : null,
      })
      setNotice(result?.message ?? `Invite sent to ${clean}.`)
      setEmail('')
      setPlantId('')
      await load()
    } catch (e) {
      setError(e.message ?? 'Could not invite this user.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="tc-label mb-3">ESG Lead · Settings · Users</p>
      <h1 className="tc-h2 mb-6">Users</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr]">
        {/* Invite */}
        <Card>
          <p className="tc-subhead mb-4">Invite a user</p>
          <p className="tc-body mb-6 text-stone">
            Adds the authorization row and emails a magic-link invite. The person gains access on
            first sign-in.
          </p>
          <form onSubmit={onInvite} className="flex flex-col gap-5">
            <Field label="Work email" htmlFor="u-email" required>
              <Input
                id="u-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@thecorporate.com"
              />
            </Field>
            <Field label="Role" htmlFor="u-role" required>
              <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
            {role === 'plant_manager' && (
              <Field label="Plant" htmlFor="u-plant" required hint="Plant managers are scoped to one plant.">
                <Select id="u-plant" value={plantId} onChange={(e) => setPlantId(e.target.value)}>
                  <option value="">Select…</option>
                  {plants.map((p) => (
                    <option key={p.plant_id} value={p.plant_id}>
                      {p.plant_name} ({p.plant_id})
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {role === 'sourcing_manager' && (
              <p className="font-sans text-[12px] text-stone">
                Sourcing managers submit global (corporate-wide) projects — no plant.
              </p>
            )}

            {error && <p className="font-sans text-[13px] text-danger">{error}</p>}
            {notice && <p className="font-sans text-[13px] text-success">{notice}</p>}

            <div>
              <Button type="submit" disabled={busy}>
                {busy ? 'Inviting…' : 'Send invite'}
              </Button>
            </div>
          </form>
        </Card>

        {/* List */}
        <Card elevated className="overflow-x-auto">
          <p className="tc-subhead mb-4">Provisioned users</p>
          {loading ? (
            <p className="tc-body text-stone">Loading…</p>
          ) : loadError ? (
            <p className="font-sans text-[14px] text-danger">{loadError}</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Plant</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    <td className="whitespace-nowrap">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="whitespace-nowrap">{u.plant_id ?? '—'}</td>
                    <td className="whitespace-nowrap">
                      <span className={u.user_id ? 'text-success' : 'text-stone'}>
                        {u.user_id ? 'Active' : 'Invited'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
