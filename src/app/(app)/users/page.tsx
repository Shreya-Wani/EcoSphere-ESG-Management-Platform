'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/data-table'
import { RecordDrawer } from '@/components/shared/record-drawer'
import { FormField } from '@/components/shared/form-field'
import { EmptyState } from '@/components/shared/empty-state'

const ROLES = [
  'ADMIN',
  'ESG_MANAGER',
  'HR_MANAGER',
  'AUDITOR',
  'COMPLIANCE_OFFICER',
  'EMPLOYEE',
] as const
type Role = (typeof ROLES)[number]

interface UserRow {
  id: string
  name: string
  email: string
  role: Role
}

interface DeptLite {
  id: string
  name: string
}

const inputCls =
  'w-full px-3 py-2 border border-input-line rounded-lg text-sm outline-none focus:ring-brand-primary/15 focus:border-brand-primary'

async function getUsers(): Promise<UserRow[]> {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to load users')
  return (await res.json()).users
}

async function getDepartments(): Promise<DeptLite[]> {
  const res = await fetch('/api/departments')
  if (!res.ok) return []
  return (await res.json()).departments
}

type FormState = {
  name: string
  email: string
  password: string
  role: Role
  departmentId: string
}

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  departmentId: '',
}

export default function UsersPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const qc = useQueryClient()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          departmentId: form.departmentId || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || (res.status === 422 ? 'Validation failed' : 'Create failed'))
      }
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
      setForm(emptyForm)
      setError(null)
    },
    onError: (e: Error) => setError(e.message),
  })

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Role update failed')
      }
      return res.json()
    },
    onSuccess: invalidate,
  })

  const columns: Column<UserRow>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (_v, u) =>
        isAdmin ? (
          <select
            value={u.role}
            disabled={changeRole.isPending}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value as Role })}
            className="rounded-lg border border-input-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 disabled:opacity-50"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-medium text-ink">{u.role}</span>
        ),
    },
  ]

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Users &amp; Roles</h1>
          <p className="mt-1 text-sm text-ink-2">Manage who has access and what role they hold.</p>
        </div>
        <EmptyState
          icon="🔒"
          title="Admins only"
          description="Only administrators can view and manage user roles."
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Users &amp; Roles</h1>
          <p className="mt-1 text-sm text-ink-2">
            Assign one of six roles per user. Roles drive every permission across the platform.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm)
            setError(null)
            setDrawerOpen(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New User
        </button>
      </div>

      <DataTable columns={columns} data={users} loading={isLoading} />

      <RecordDrawer
        open={drawerOpen}
        onOpenChange={(o) => setDrawerOpen(o)}
        title="New User"
        onSave={() => create.mutate()}
        onDiscard={() => setDrawerOpen(false)}
        loading={create.isPending}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-pill-red-fg/30 bg-pill-red-bg px-3 py-2 text-sm text-pill-red-fg">
              {error}
            </div>
          )}
          <FormField label="Name" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ravi Sharma"
            />
          </FormField>
          <FormField label="Email" required>
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ravi@ecosphere.dev"
            />
          </FormField>
          <FormField label="Temporary Password" required>
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </FormField>
          <FormField label="Role" required>
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department">
            <select
              className={inputCls}
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </RecordDrawer>
    </div>
  )
}
