'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Search, X } from 'lucide-react'
import { useToast } from '@/components/shared/toast'
import { useCurrentUser } from '@/lib/hooks'
import { can } from '@/lib/roles'
import { apiPost, apiPatch, apiDelete, ApiError } from '@/lib/api'

// ---------- Types ----------
type Department = { id: string; name: string }
type Goal = {
  id: string
  name: string
  departmentId: string
  departmentName: string | null
  targetCo2: number
  currentCo2: number
  deadline: string | null
  status: string
  createdAt: string
}

type FormValues = {
  name: string
  departmentId: string
  targetCo2: number
  deadline: string
  status: 'DRAFT' | 'ACTIVE' | 'ON_TRACK' | 'COMPLETED' | 'EXPIRED'
}

// ---------- Design Tokens ----------
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:     { label: 'Draft',     bg: 'bg-surface-2',   text: 'text-ink-2'   },
  ACTIVE:    { label: 'Active',    bg: 'bg-pill-blue-bg',    text: 'text-pill-blue-fg'   },
  ON_TRACK:  { label: 'On Track',  bg: 'bg-pill-green-bg', text: 'text-pill-green-fg'},
  COMPLETED: { label: 'Completed', bg: 'bg-purple-50',  text: 'text-purple-700' },
  EXPIRED:   { label: 'Expired',   bg: 'bg-pill-red-bg',     text: 'text-pill-red-fg'    },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-surface-2', text: 'text-ink-2' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const color = pct >= 100 ? 'bg-pill-red-fg' : pct >= 80 ? 'bg-pill-amber-fg' : 'bg-brand-primary'
  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div className="flex-1 bg-track rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-ink-2 w-10 text-right font-medium">{pct.toFixed(0)}%</span>
    </div>
  )
}

export default function EnvironmentalGoalsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { role } = useCurrentUser()
  const canManage = can.manageGoal(role)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)
  const [search, setSearch] = useState('')

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => fetch('/api/goals').then(r => r.json()),
  })

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => fetch('/api/departments').then(r => r.json()).then(d => d.departments ?? []),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q ? goals.filter(g => g.name.toLowerCase().includes(q) || (g.departmentName ?? '').toLowerCase().includes(q)) : goals
  }, [goals, search])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', departmentId: '', targetCo2: 0, deadline: '', status: 'ACTIVE' },
  })

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, targetCo2: Number(values.targetCo2), deadline: values.deadline || null }
      return selected ? apiPatch(`/api/goals/${selected.id}`, payload) : apiPost('/api/goals', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast({ title: selected ? 'Goal updated' : 'Goal created' })
      closeDrawer()
    },
    onError: (e: ApiError) =>
      toast({ title: 'Save failed', description: e.message, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/goals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast({ title: 'Goal deleted' })
      setDeleteTarget(null)
    },
    onError: (e: ApiError) =>
      toast({ title: 'Delete failed', description: e.message, variant: 'error' }),
  })

  const openCreate = () => { setSelected(null); reset({ name: '', departmentId: departments[0]?.id ?? '', targetCo2: 0, deadline: '', status: 'ACTIVE' }); setDrawerOpen(true) }
  const openEdit = (item: Goal) => {
    setSelected(item)
    reset({ name: item.name, departmentId: item.departmentId, targetCo2: item.targetCo2, deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '', status: item.status as FormValues['status'] })
    setDrawerOpen(true)
  }
  const closeDrawer = () => { setDrawerOpen(false); setSelected(null) }

  return (
    <div className="min-h-full bg-canvas">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Environmental Goals</h1>
          <p className="text-sm text-ink-2 mt-0.5">{isLoading ? '…' : `${goals.length} goals`} · Set and track CO₂ reduction targets</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary-dark transition-colors">
            <Plus className="w-4 h-4" />New Goal
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-lg flex-1 max-w-xs shadow-[0_1px_2px_rgba(31,41,55,.04)]">
          <Search className="w-4 h-4 text-faint shrink-0" />
          <input type="text" placeholder="Search by name or department…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none placeholder:text-faint" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-faint" /></button>}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-[0_1px_2px_rgba(31,41,55,.04)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft">
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Goal Name</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Department</th>
              <th className="text-right text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Target (t CO₂e)</th>
              <th className="text-right text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Current (t CO₂e)</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Progress</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Deadline</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading ? [...Array(4)].map((_, i) => (
              <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="px-5 py-3.5"><div className="h-4 bg-surface-2 rounded animate-pulse w-3/4" /></td>)}</tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">🎯</span>
                  <p className="text-sm font-medium text-ink-2">No goals found</p>
                </div>
              </td></tr>
            ) : filtered.map(g => (
              <tr key={g.id} onClick={() => canManage && openEdit(g)} className={`hover:bg-accent-soft transition-colors group ${canManage ? 'cursor-pointer' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-ink">{g.name}</td>
                <td className="px-5 py-3.5 text-ink-2">{g.departmentName ?? <span className="text-faint">—</span>}</td>
                <td className="px-5 py-3.5 text-right font-mono text-ink">{Number(g.targetCo2).toFixed(1)}</td>
                <td className="px-5 py-3.5 text-right font-mono font-semibold text-ink">{Number(g.currentCo2).toFixed(1)}</td>
                <td className="px-5 py-3.5"><ProgressBar current={g.currentCo2} target={g.targetCo2} /></td>
                <td className="px-5 py-3.5 text-ink-2 text-xs">{g.deadline ? new Date(g.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : <span className="text-faint">—</span>}</td>
                <td className="px-5 py-3.5"><StatusBadge status={g.status} /></td>
                <td className="px-5 py-3.5">
                  {canManage && (
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(g) }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-pill-red-bg text-faint hover:text-pill-red-fg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="w-[460px] bg-surface shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line-soft">
              <div>
                <h2 className="text-base font-semibold text-ink">{selected ? 'Edit Goal' : 'New Environmental Goal'}</h2>
                {selected && <p className="text-xs text-faint mt-0.5">{selected.name}</p>}
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-md hover:bg-hover text-faint"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Progress Summary for existing */}
              {selected && (
                <div className="p-4 bg-canvas border border-brand-primary/20 rounded-xl space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider">Current Progress</p>
                      <p className="text-xs text-ink-2 mt-0.5">Auto-synced from confirmed transactions</p>
                    </div>
                    <p className="text-2xl font-bold text-ink">{selected.currentCo2.toFixed(1)} <span className="text-sm font-normal text-ink-2">t</span></p>
                  </div>
                  <ProgressBar current={selected.currentCo2} target={selected.targetCo2} />
                </div>
              )}

              <form className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Goal Name <span className="text-pill-red-fg">*</span></label>
                  <input {...register('name', { required: 'Name is required' })} placeholder="e.g. FY26 Logistics Reduction"
                    className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition" />
                  {errors.name && <p className="text-xs text-pill-red-fg">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Department <span className="text-pill-red-fg">*</span></label>
                  <select {...register('departmentId', { required: 'Department is required' })} className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface transition">
                    <option value="">— Select —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {errors.departmentId && <p className="text-xs text-pill-red-fg">Required</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink">Target (t CO₂e) <span className="text-pill-red-fg">*</span></label>
                    <input type="number" step="0.1" {...register('targetCo2', { required: true, valueAsNumber: true, validate: v => Number(v) > 0 || 'Must be > 0' })}
                      className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 font-mono transition" />
                    {errors.targetCo2 && <p className="text-xs text-pill-red-fg">Required</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink">Deadline</label>
                    <input type="date" {...register('deadline')} className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Status</label>
                  <select {...register('status')} className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface transition">
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-line-soft flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:bg-hover transition-colors">Discard</button>
              <button onClick={handleSubmit(v => saveMutation.mutate(v))} disabled={saveMutation.isPending} className="px-5 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-dark disabled:opacity-60 transition-colors">
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-pill-red-bg rounded-xl shrink-0"><Trash2 className="w-5 h-5 text-pill-red-fg" /></div>
              <div>
                <h3 className="font-semibold text-ink">Delete Goal</h3>
                <p className="text-sm text-ink-2 mt-1">Delete <span className="font-medium text-ink">&ldquo;{deleteTarget.name}&rdquo;</span>? This cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:bg-hover">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-pill-red-fg rounded-lg hover:brightness-95 disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
