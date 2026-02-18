import { useCallback, useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import ErrorBox from '../components/ErrorBox'
import { AdminService, type AdminUserSummary, type AdminUsersPageResponse } from '../services/admin'
import { IconShieldCog } from '@tabler/icons-react'
import { PLAN_DETAILS, PLAN_CODE_TO_NAME, type PlanCode } from '../constants/planes'

const PAGE_SIZE = 25

type DraftState = {
  role: 'USER' | 'SUPERUSER'
  plan: PlanCode
  durationMonths: string
}

type DraftMap = Record<string, DraftState>

function buildDrafts(users: AdminUserSummary[], prev: DraftMap): DraftMap {
  const next: DraftMap = {}
  users.forEach((user) => {
    next[user.id] = prev[user.id] ?? {
      role: user.role,
      plan: user.currentPlan,
      durationMonths: '1'
    }
  })
  return next
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export default function AdminUsersPage() {
  const [response, setResponse] = useState<AdminUsersPageResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [message, setMessage] = useState<string | null>(null)
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null)
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)

  const loadUsers = useCallback(async (page = 0) => {
    setLoading(true)
    setError(null)
    try {
      const next = await AdminService.listUsers(page, PAGE_SIZE)
      setResponse(next)
      setDrafts((prev) => buildDrafts(next.items, prev))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers(0)
  }, [loadUsers])

  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch
      }
    }))
  }

  const handleRoleSave = async (user: AdminUserSummary) => {
    const draft = drafts[user.id]
    if (!draft || draft.role === user.role) return
    setSavingRoleId(user.id)
    setError(null)
    setMessage(null)
    try {
      await AdminService.updateUserRole(user.id, { role: draft.role })
      setMessage(`Rol actualizado para ${user.email}.`)
      await loadUsers(response?.page ?? 0)
    } catch (err) {
      setError(err)
    } finally {
      setSavingRoleId(null)
    }
  }

  const handlePlanSave = async (user: AdminUserSummary) => {
    const draft = drafts[user.id]
    if (!draft) return
    const durationMonths = Number.parseInt(draft.durationMonths, 10)
    setSavingPlanId(user.id)
    setError(null)
    setMessage(null)
    try {
      await AdminService.updateUserPlan(user.id, {
        plan: draft.plan,
        durationMonths: Number.isFinite(durationMonths) && durationMonths > 0 ? durationMonths : undefined
      })
      setMessage(`Plan actualizado para ${user.email}.`)
      await loadUsers(response?.page ?? 0)
    } catch (err) {
      setError(err)
    } finally {
      setSavingPlanId(null)
    }
  }

  const currentPage = response?.page ?? 0
  const totalPages = response?.totalPages ?? 0
  const users = response?.items ?? []

  return (
    <div className="space-y-6">
      <SectionHeader
        section="Superusuario"
        icon={<IconShieldCog />}
        title="Administración de usuarios"
        subtitle="Gestioná roles y planes de los clientes desde un único panel."
      />

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {response ? `Mostrando ${users.length} de ${response.totalElements} usuarios` : 'Cargando usuarios...'}
          </p>
          <button type="button" className="btn" onClick={() => void loadUsers(currentPage)} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar listado'}
          </button>
        </div>

        <ErrorBox error={error} />
        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">CUIT</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Duración (meses)</th>
                <th className="px-3 py-2">Vence</th>
                <th className="px-3 py-2">Alta</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const draft = drafts[user.id]
                const savingRole = savingRoleId === user.id
                const savingPlan = savingPlanId === user.id
                return (
                  <tr key={user.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{user.name ?? 'Sin nombre'}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{user.cuit ?? '-'}</td>
                    <td className="px-3 py-3">
                      <select
                        className="input min-w-36"
                        value={draft?.role ?? user.role}
                        onChange={(event) => updateDraft(user.id, { role: event.target.value as DraftState['role'] })}
                      >
                        <option value="USER">USER</option>
                        <option value="SUPERUSER">SUPERUSER</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="input min-w-40"
                        value={draft?.plan ?? user.currentPlan}
                        onChange={(event) => updateDraft(user.id, { plan: event.target.value as PlanCode })}
                      >
                        {PLAN_DETAILS.map((plan) => (
                          <option key={plan.code} value={plan.code}>
                            {PLAN_CODE_TO_NAME[plan.code]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={1}
                        className="input w-24"
                        value={draft?.durationMonths ?? '1'}
                        onChange={(event) => updateDraft(user.id, { durationMonths: event.target.value })}
                      />
                    </td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(user.planExpiresAt)}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => void handleRoleSave(user)}
                          disabled={savingRole || savingPlan}
                        >
                          {savingRole ? 'Guardando...' : 'Guardar rol'}
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => void handlePlanSave(user)}
                          disabled={savingPlan || savingRole}
                        >
                          {savingPlan ? 'Guardando...' : 'Guardar plan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && users.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="btn"
            disabled={loading || currentPage <= 0}
            onClick={() => void loadUsers(Math.max(0, currentPage - 1))}
          >
            Página anterior
          </button>
          <span className="text-sm text-slate-600">
            Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}
          </span>
          <button
            type="button"
            className="btn"
            disabled={loading || totalPages === 0 || currentPage + 1 >= totalPages}
            onClick={() => void loadUsers(currentPage + 1)}
          >
            Página siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
