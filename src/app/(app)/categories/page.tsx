'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Search, X } from 'lucide-react'
import { useToast } from '@/components/shared/toast'
import { useCurrentUser } from '@/lib/hooks'
import { can } from '@/lib/roles'
import { apiPost, apiPatch, apiDelete, ApiError } from '@/lib/api'

type Category = {
  id: string
  name: string
  type: 'CSR_ACTIVITY' | 'CHALLENGE'
  status: 'ACTIVE' | 'INACTIVE'
}

type FormValues = { name: string; type: 'CSR_ACTIVITY' | 'CHALLENGE'; status: 'ACTIVE' | 'INACTIVE' }

const TYPE_CONFIG = {
  CSR_ACTIVITY: { label: 'CSR Activity', bg: 'bg-pill-green-bg', text: 'text-pill-green-fg' },
  CHALLENGE:    { label: 'Challenge',    bg: 'bg-pill-blue-bg',  text: 'text-pill-blue-fg'  },
}

function TypePill({ type }: { type: string }) {
  const c = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? { label: type, bg: 'bg-canvas', text: 'text-ink-2' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
}

function StatusBadge({ status }: { status: string }) {
  const s = status === 'ACTIVE' ? { bg: 'bg-pill-green-bg', text: 'text-pill-green-fg' } : { bg: 'bg-surface-2', text: 'text-ink-2' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { role } = useCurrentUser()
  const canManage = can.manageCategory(role)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [search, setSearch] = useState('')

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q ? categories.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)) : categories
  }, [categories, search])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', type: 'CSR_ACTIVITY', status: 'ACTIVE' },
  })

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      selected ? apiPatch(`/api/categories/${selected.id}`, values) : apiPost('/api/categories', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['options'] })
      toast({ title: selected ? 'Category updated' : 'Category created' })
      closeDrawer()
    },
    onError: (e: ApiError) =>
      toast({ title: 'Save failed', description: e.message, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['options'] })
      toast({ title: 'Category deleted' })
      setDeleteTarget(null)
    },
    onError: (e: ApiError) =>
      toast({ title: 'Delete failed', description: e.message, variant: 'error' }),
  })

  const openCreate = () => { setSelected(null); reset({ name: '', type: 'CSR_ACTIVITY', status: 'ACTIVE' }); setDrawerOpen(true) }
  const openEdit = (item: Category) => { setSelected(item); reset({ name: item.name, type: item.type, status: item.status }); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setSelected(null) }

  return (
    <div className="min-h-full bg-canvas">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Categories</h1>
          <p className="text-sm text-ink-2 mt-0.5">{isLoading ? '…' : `${categories.length} categories`} · CSR Activity and Challenge taxonomy</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary-dark transition-colors">
            <Plus className="w-4 h-4" />New Category
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-lg flex-1 max-w-xs shadow-[0_1px_2px_rgba(31,41,55,.04)]">
          <Search className="w-4 h-4 text-faint shrink-0" />
          <input type="text" placeholder="Search by name or type…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none placeholder:text-faint" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-faint" /></button>}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-[0_1px_2px_rgba(31,41,55,.04)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft">
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-faint uppercase tracking-wider px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading ? [...Array(4)].map((_, i) => (
              <tr key={i}>{[...Array(4)].map((_, j) => <td key={j} className="px-5 py-3.5"><div className="h-4 bg-surface-2 rounded animate-pulse w-3/4" /></td>)}</tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-faint">
                  <span className="text-4xl">🗂️</span>
                  <p className="text-sm font-medium text-ink-2">No categories found</p>
                </div>
              </td></tr>
            ) : filtered.map(cat => (
              <tr key={cat.id} onClick={() => canManage && openEdit(cat)} className={`hover:bg-accent-soft transition-colors group ${canManage ? 'cursor-pointer' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-ink">{cat.name}</td>
                <td className="px-5 py-3.5"><TypePill type={cat.type} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={cat.status} /></td>
                <td className="px-5 py-3.5">
                  {canManage && (
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(cat) }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-pill-red-bg text-faint hover:text-pill-red-fg transition-all">
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
          <div className="w-[420px] bg-surface shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line-soft">
              <h2 className="text-base font-semibold text-ink">{selected ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={closeDrawer} className="p-1.5 rounded-md hover:bg-hover text-faint"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(v => saveMutation.mutate(v))} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Name <span className="text-pill-red-fg">*</span></label>
                <input {...register('name', { required: 'Name is required' })} placeholder="e.g. Community Service" className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition" />
                {errors.name && <p className="text-xs text-pill-red-fg">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Type <span className="text-pill-red-fg">*</span></label>
                <select {...register('type')} className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface transition">
                  <option value="CSR_ACTIVITY">CSR Activity</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Status</label>
                <select {...register('status')} className="w-full px-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface transition">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </form>
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
                <h3 className="font-semibold text-ink">Delete Category</h3>
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
