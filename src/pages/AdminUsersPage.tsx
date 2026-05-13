import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ErrorBox from '../components/ErrorBox'
import { AdminService, type AdminUserSummary, type AdminUsersPageResponse } from '../services/admin'
import { PLAN_DETAILS, PLAN_CODE_TO_NAME, type PlanCode } from '../constants/planes'
import { IconCalendar, IconId, IconRefresh, IconShield, IconUser } from '@tabler/icons-react'

const PAGE_SIZE = 25

type DraftState = {
  role: 'USER' | 'SUPERUSER'
  plan: PlanCode
  durationMonths: string
}

type DraftMap = Record<string, DraftState>

function buildDrafts(users: AdminUserSummary[], prev: DraftMap): DraftMap {
  const next: DraftMap = { ...prev }
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
  const [roleModalUser, setRoleModalUser] = useState<AdminUserSummary | null>(null)
  const [planModalUser, setPlanModalUser] = useState<AdminUserSummary | null>(null)
  const usersSentinelRef = useRef<HTMLDivElement | null>(null)

  const loadUsers = useCallback(async (page = 0, mode: 'replace' | 'append' = 'replace') => {
    setLoading(true)
    setError(null)
    try {
      const next = await AdminService.listUsers(page, PAGE_SIZE)
      setResponse((current) => {
        if (mode === 'append' && current) {
          const existingIds = new Set(current.items.map((user) => user.id))
          const appendedItems = next.items.filter((user) => !existingIds.has(user.id))
          return { ...next, items: [...current.items, ...appendedItems] }
        }
        return next
      })
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

  useEffect(() => {
    const sentinel = usersSentinelRef.current
    if (!sentinel || !response) return
    const hasMore = response.totalPages > 0 && response.page + 1 < response.totalPages
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loading) {
          void loadUsers(response.page + 1, 'append')
        }
      },
      { rootMargin: '180px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadUsers, loading, response])

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
      setRoleModalUser(null)
      await loadUsers(0)
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
      setPlanModalUser(null)
      await loadUsers(0)
    } catch (err) {
      setError(err)
    } finally {
      setSavingPlanId(null)
    }
  }

  const users = response?.items ?? []

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Superusuario</h2>
            <p>Administración de usuarios, roles y planes activos.</p>
          </div>
          <button type="button" className="ops-icon-button" onClick={() => void loadUsers(0)} disabled={loading}>
            <IconRefresh className={loading ? 'animate-spin' : undefined} />
            <span>{loading ? 'Actualizando' : 'Actualizar'}</span>
          </button>
        </div>

        <ErrorBox error={error} />
        {message && <div className="ops-action-message">{message}</div>}

        <div className="ops-stats-grid admin-users-stats">
          <div className="ops-stat-card">
            <span>Usuarios cargados</span>
            <strong>{response ? users.length : '-'}</strong>
          </div>
          <div className="ops-stat-card">
            <span>Total usuarios</span>
            <strong>{response ? response.totalElements : '-'}</strong>
          </div>
          <div className="ops-stat-card">
            <span>Superusuarios</span>
            <strong>{users.filter((user) => user.role === 'SUPERUSER').length}</strong>
          </div>
        </div>

        <div className="mail-list-section">
          <div className="ops-table-section__header">
            <p>{response ? `Mostrando ${users.length} de ${response.totalElements} usuarios` : 'Cargando usuarios'}</p>
          </div>

          <div className="mail-list">
            {users.map((user) => {
              const savingRole = savingRoleId === user.id
              const savingPlan = savingPlanId === user.id
              return (
                <article key={user.id} className="mail-card admin-user-card">
                  <div className="mail-card__icon admin-user-card__icon">
                    <IconUser />
                  </div>

                  <div className="mail-card__content">
                    <div className="mail-card__main">
                      <div className="mail-card__title">
                        <strong>{user.name ?? 'Sin nombre'}</strong>
                        <span>{user.email}</span>
                      </div>
                      <div className="mail-card__pills">
                        <span className={`admin-user-pill admin-user-pill--${user.role.toLowerCase()}`}>
                          <IconShield />
                          {user.role === 'SUPERUSER' ? 'Superusuario' : 'Usuario'}
                        </span>
                        <span className="admin-user-pill admin-user-pill--plan">
                          {PLAN_CODE_TO_NAME[user.currentPlan]}
                        </span>
                      </div>
                    </div>

                    <div className="admin-user-card__meta">
                      <div className="mail-card__meta">
                        <span>CUIT</span>
                        <strong>{user.cuit ?? '-'}</strong>
                      </div>
                      <div className="mail-card__meta">
                        <span>Vence</span>
                        <strong>{formatDate(user.planExpiresAt)}</strong>
                      </div>
                      <div className="mail-card__meta">
                        <span>Alta</span>
                        <strong>{formatDate(user.createdAt)}</strong>
                      </div>
                    </div>

                  </div>

                  <div className="admin-user-card__actions">
                    <button
                      type="button"
                      className="mail-card__action admin-user-card__action"
                      onClick={() => {
                        updateDraft(user.id, { role: user.role })
                        setRoleModalUser(user)
                      }}
                      disabled={savingRole || savingPlan}
                    >
                      <IconId />
                      <span>{savingRole ? 'Guardando' : 'Editar rol'}</span>
                    </button>
                    <button
                      type="button"
                      className="mail-card__action admin-user-card__action admin-user-card__action--primary"
                      onClick={() => {
                        updateDraft(user.id, { plan: user.currentPlan, durationMonths: '1' })
                        setPlanModalUser(user)
                      }}
                      disabled={savingPlan || savingRole}
                    >
                      <IconCalendar />
                      <span>{savingPlan ? 'Guardando' : 'Editar plan'}</span>
                    </button>
                  </div>
                </article>
              )
            })}
            {!loading && users.length === 0 && (
              <div className="mail-list__empty">
                No hay usuarios para mostrar.
              </div>
            )}
          </div>
        </div>

        <div className="ops-infinite-status" ref={usersSentinelRef}>
          <span>
            {response
              ? `${users.length} de ${response.totalElements} usuarios`
              : 'Sin usuarios cargados'}
          </span>
          {loading && (
            <span className="ops-infinite-status__loading">
              <IconRefresh className="animate-spin" />
              Cargando más
            </span>
          )}
          {response && response.totalPages > 0 && response.page + 1 >= response.totalPages && users.length > 0 && (
            <span>Fin del listado</span>
          )}
        </div>
      </section>

      {roleModalUser && createPortal(
        <RoleModal
          user={roleModalUser}
          draft={drafts[roleModalUser.id]}
          saving={savingRoleId === roleModalUser.id}
          onChange={(role) => updateDraft(roleModalUser.id, { role })}
          onClose={() => setRoleModalUser(null)}
          onSave={() => void handleRoleSave(roleModalUser)}
        />,
        document.body
      )}

      {planModalUser && createPortal(
        <PlanModal
          user={planModalUser}
          draft={drafts[planModalUser.id]}
          saving={savingPlanId === planModalUser.id}
          onPlanChange={(plan) => updateDraft(planModalUser.id, { plan })}
          onDurationChange={(durationMonths) => updateDraft(planModalUser.id, { durationMonths })}
          onClose={() => setPlanModalUser(null)}
          onSave={() => void handlePlanSave(planModalUser)}
        />,
        document.body
      )}
    </div>
  )
}

const RoleModal = ({
  user,
  draft,
  saving,
  onChange,
  onClose,
  onSave
}: {
  user: AdminUserSummary
  draft?: DraftState
  saving: boolean
  onChange: (role: DraftState['role']) => void
  onClose: () => void
  onSave: () => void
}) => {
  const role = draft?.role ?? user.role
  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="admin-role-modal-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="auth-modal__panel admin-user-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <h1 id="admin-role-modal-title" className="auth-modal__title">Modificar rol</h1>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          </div>
          <button type="button" className="auth-modal__close" aria-label="Cerrar modal" onClick={onClose}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="admin-user-modal__body">
          <label className="admin-user-control">
            <span>Rol</span>
            <select className="input" value={role} onChange={(event) => onChange(event.target.value as DraftState['role'])}>
              <option value="USER">Usuario</option>
              <option value="SUPERUSER">Superusuario</option>
            </select>
          </label>

          <div className="admin-user-modal__actions">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={onSave} disabled={saving || role === user.role}>
              {saving ? 'Guardando' : 'Guardar rol'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PlanModal = ({
  user,
  draft,
  saving,
  onPlanChange,
  onDurationChange,
  onClose,
  onSave
}: {
  user: AdminUserSummary
  draft?: DraftState
  saving: boolean
  onPlanChange: (plan: PlanCode) => void
  onDurationChange: (durationMonths: string) => void
  onClose: () => void
  onSave: () => void
}) => {
  const plan = draft?.plan ?? user.currentPlan
  const durationMonths = draft?.durationMonths ?? '1'
  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="admin-plan-modal-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="auth-modal__panel admin-user-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <h1 id="admin-plan-modal-title" className="auth-modal__title">Modificar plan</h1>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          </div>
          <button type="button" className="auth-modal__close" aria-label="Cerrar modal" onClick={onClose}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="admin-user-modal__body">
          <label className="admin-user-control">
            <span>Plan</span>
            <select className="input" value={plan} onChange={(event) => onPlanChange(event.target.value as PlanCode)}>
              {PLAN_DETAILS.map((planItem) => (
                <option key={planItem.code} value={planItem.code}>
                  {PLAN_CODE_TO_NAME[planItem.code]}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-user-control">
            <span>Duración en meses</span>
            <input
              type="number"
              min={1}
              className="input"
              value={durationMonths}
              onChange={(event) => onDurationChange(event.target.value)}
            />
          </label>

          <div className="admin-user-modal__actions">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando' : 'Guardar plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
