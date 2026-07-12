'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Pencil, Search, X } from 'lucide-react'
import { useToast } from '@/components/shared/toast'
import { useCurrentUser } from '@/lib/hooks'
import { can } from '@/lib/roles'
import { apiPost, apiPatch, apiDelete, ApiError } from '@/lib/api'

// ---------- Types ----------
type EmissionFactor = {
  id: string
  name: string
  category: string
  unit: string
  co2PerUnit: number
  source: string | null
  country: string | null
  effectiveDate: string | null
  status: string
}

type FormValues = {
  name: string
  category: 'FUEL' | 'ELECTRICITY' | 'MATERIAL' | 'TRANSPORT'
  unit: string
  co2PerUnit: number
  source: string
  country: string
  effectiveDate: string
  status: 'ACTIVE' | 'INACTIVE'
}

// ---------- Design tokens ----------
const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  FUEL:        { label: 'Fuel',        bg: 'bg-orange-50', text: 'text-orange-700' },
  ELECTRICITY: { label: 'Electricity', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  MATERIAL:    { label: 'Material',    bg: 'bg-pill-blue-bg',   text: 'text-pill-blue-fg'   },
  TRANSPORT:   { label: 'Transport',   bg: 'bg-violet-50', text: 'text-violet-700' },
}

function CategoryPill({ category }: { category: string }) {
  const c = CATEGORY_CONFIG[category] ?? { label: category, bg: 'bg-canvas', text: 'text-ink-2' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status === 'ACTIVE'
    ? { bg: 'bg-pill-green-bg', text: 'text-pill-green-fg' }
    : { bg: 'bg-surface-2',   text: 'text-ink-2'   }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  )
}

// ---------- Main page ----------
export default function EmissionFactorsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { role } = useCurrentUser()
  const canManage = can.manageEmissionFactor(role)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<EmissionFactor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmissionFactor | null>(null)
  const [search, setSearch] = useState('')

  const { data: factors = [], isLoading } = useQuery<EmissionFactor[]>({
    queryKey: ['emission-factors'],
    queryFn: () => fetch('/api/emission-factors').then(r => r.json()),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return factors
    return factors.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      (f.source ?? '').toLowerCase().includes(q)
    )
  }, [factors, search])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', category: 'FUEL', unit: '', co2PerUnit: 0, source: '', country: '', effectiveDate: '', status: 'ACTIVE' },
  })

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, co2PerUnit: Number(values.co2PerUnit), source: values.source || undefined, country: values.country || undefined, effectiveDate: values.effectiveDate || undefined }
      return selected
        ? apiPatch(`/api/emission-factors/${selected.id}`, payload)
        : apiPost('/api/emission-factors', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emission-factors'] })
      toast({ title: selected ? 'Factor updated' : 'Factor created' })
      closeDrawer()
    },
    onError: (e: ApiError) =>
      toast({ title: 'Save failed', description: e.message, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/emission-factors/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emission-factors'] })
      toast({ title: 'Factor deleted' })
      setDeleteTarget(null)
    },
    onError: (e: ApiError) =>
      toast({ title: 'Delete failed', description: e.message, variant: 'error' }),
  })

  const openCreate = () => { setSelected(null); reset({ name: '', category: 'FUEL', unit: '', co2PerUnit: 0, source: '', country: '', effectiveDate: '', status: 'ACTIVE' }); setDrawerOpen(true) }
  const openEdit = (item: EmissionFactor) => {
    setSelected(item)
    reset({ name: item.name, category: item.category as any, unit: item.unit, co2PerUnit: item.co2PerUnit, source: item.source ?? '', country: item.country ?? '', effectiveDate: item.effectiveDate ? new Date(item.effectiveDate).toISOString().split('T')[0] : '', status: item.status as any })
    setDrawerOpen(true)
  }
  const closeDrawer = () => { setDrawerOpen(false); setSelected(null) }

  return (
    <div className="min-h-full bg-canvas">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Emission Factors</h1>
          <p className="text-sm text-ink-2 mt-0.5">
            {isLoading ? '…' : `${factors.length} records`} · CO₂ equivalents per emission unit
          </p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary-dark transition-colors">
            <Plus className="w-4 h-4" />
            New Factor
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-lg flex-1 max-w-xs shadow-[0_1px_2px_rgba(31,41,55,.04)]">
          <Search className="w-4 h-4 text-faint shrink-0" />
          <input
            type="text"
            placeholder="Search factor, category or source…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-faint"
          />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-faint" /></button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-line shadow-[0_1px_2px_rgba(31,41,55,.04)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft">
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Category</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Unit</th>
              <th className="text-right text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">CO₂/Unit (kg)</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Source</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-surface-2 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-faint">
                    <span className="text-4xl">🌱</span>
                    <p className="text-sm font-medium text-ink-2">No emission factors found</p>
                    <p className="text-xs">Add your first factor to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(factor => (
                <tr
                  key={factor.id}
                  onClick={() => canManage && openEdit(factor)}
                  className={`hover:bg-accent-soft transition-colors group ${canManage ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-5 py-3.5 font-medium text-ink">{factor.name}</td>
                  <td className="px-5 py-3.5"><CategoryPill category={factor.category} /></td>
                  <td className="px-5 py-3.5 text-ink-2 font-mono text-xs">{factor.unit}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink font-mono">{Number(factor.co2PerUnit).toFixed(4)}</td>
                  <td className="px-5 py-3.5 text-ink-2 text-xs">{factor.source ?? <span className="text-faint">—</span>}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={factor.status} /></td>
                  <td className="px-5 py-3.5">
                    {canManage && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(factor) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-pill-red-bg text-faint hover:text-pill-red-fg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="w-[460px] bg-surface shadow-2xl flex flex-col h-full">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line-soft">
              <div>
                <h2 className="text-base font-semibold text-ink">{selected ? 'Edit Emission Factor' : 'New Emission Factor'}</h2>
                {selected && <p className="text-xs text-faint mt-0.5">{selected.name}</p>}
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-md hover:bg-hover text-faint">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer body */}
            <form onSubmit={handleSubmit(v => saveMutation.mutate(v))} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Name <span className="text-pill-red-fg">*</span></label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition"
                  placeholder="e.g. Diesel combustion"
                />
                {errors.name && <p className="text-xs text-pill-red-fg">{errors.name.message}</p>}
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Category <span className="text-pill-red-fg">*</span></label>
                  <select {...register('category')} className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface transition">
                    <option value="FUEL">Fuel</option>
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="MATERIAL">Material</option>
                    <option value="TRANSPORT">Transport</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Status</label>
                  <select {...register('status')} className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface transition">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Unit + CO2 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Unit <span className="text-pill-red-fg">*</span></label>
                  <input {...register('unit', { required: 'Unit required' })} placeholder="e.g. L, kWh, kg, km"
                    className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition" />
                  {errors.unit && <p className="text-xs text-pill-red-fg">{errors.unit.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">kg CO₂e / Unit <span className="text-pill-red-fg">*</span></label>
                  <input type="number" step="0.0001" {...register('co2PerUnit', { required: true, valueAsNumber: true, validate: v => v > 0 || 'Must be > 0' })}
                    className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 font-mono transition" />
                  {errors.co2PerUnit && <p className="text-xs text-pill-red-fg">{errors.co2PerUnit.message}</p>}
                </div>
              </div>

              {/* Source */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Source</label>
                <input {...register('source')} placeholder="e.g. DEFRA 2024, EPA"
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition" />
              </div>

              {/* Country + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Country</label>
                  <input {...register('country')} placeholder="e.g. IN, UK, US"
                    className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Effective Date</label>
                  <input type="date" {...register('effectiveDate')}
                    className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition" />
                </div>
              </div>
            </form>

            {/* Drawer footer */}
            <div className="px-6 py-4 border-t border-line-soft flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:bg-hover transition-colors">
                Discard
              </button>
              <button
                onClick={handleSubmit(v => saveMutation.mutate(v))}
                disabled={saveMutation.isPending}
                className="px-5 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-dark disabled:opacity-60 transition-colors"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-pill-red-bg rounded-xl shrink-0">
                <Trash2 className="w-5 h-5 text-pill-red-fg" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">Delete Emission Factor</h3>
                <p className="text-sm text-ink-2 mt-1">
                  Delete <span className="font-medium text-ink">&ldquo;{deleteTarget.name}&rdquo;</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:bg-hover">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-pill-red-fg rounded-lg hover:brightness-95 disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
