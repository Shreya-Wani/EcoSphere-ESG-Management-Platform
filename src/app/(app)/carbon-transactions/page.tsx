'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Plus, Trash2, Search, X, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/shared/toast'
import { useCurrentUser } from '@/lib/hooks'
import { can } from '@/lib/roles'
import { apiPost, apiPatch, apiDelete, ApiError } from '@/lib/api'

// ---------- Types ----------
type EmissionFactor = { id: string; name: string; unit: string; co2PerUnit: number; status: string }
type Department = { id: string; name: string }
type CarbonTx = {
  id: string; reference: string; sourceModule: string; product: string | null
  quantity: number; calculatedCo2: number; departmentId: string; departmentName: string | null
  emissionFactorId: string; emissionFactorName: string | null; emissionFactorUnit: string | null
  date: string; status: string
}
type KpiData = { totalCo2: number; totalCount: number; needsReviewCount: number }
type FormValues = {
  sourceModule: string; product: string; quantity: number
  emissionFactorId: string; departmentId: string; date: string
}

// ---------- Status step indicator ----------
const STATUS_STEPS = ['DRAFT', 'CONFIRMED', 'VALIDATED', 'POSTED']
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Draft', CONFIRMED: 'Confirmed', VALIDATED: 'Validated', POSTED: 'Posted', NEEDS_REVIEW: 'Needs Review' }
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT:        { bg: 'bg-surface-2',      text: 'text-ink-2'         },
  CONFIRMED:    { bg: 'bg-pill-blue-bg',   text: 'text-pill-blue-fg'  },
  VALIDATED:    { bg: 'bg-pill-green-bg',  text: 'text-pill-green-fg' },
  POSTED:       { bg: 'bg-tint-green',     text: 'text-pill-green-fg' },
  NEEDS_REVIEW: { bg: 'bg-pill-amber-bg',  text: 'text-pill-amber-fg' },
}
const STATUS_NEXT: Record<string, { label: string; next: string; Icon: typeof CheckCircle }> = {
  DRAFT:        { label: 'Confirm',    next: 'CONFIRMED', Icon: CheckCircle  },
  CONFIRMED:    { label: 'Validate',   next: 'VALIDATED', Icon: ShieldCheck  },
  NEEDS_REVIEW: { label: 'Re-confirm', next: 'CONFIRMED', Icon: AlertCircle  },
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: 'bg-surface-2', text: 'text-ink-2' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${c.bg} ${c.text}`}>{STATUS_LABELS[status] ?? status}</span>
}

function StepIndicator({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0 mb-6">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${i < idx ? 'bg-brand-primary text-white' : i === idx ? 'bg-brand-primary text-white ring-2 ring-brand-primary ring-offset-2 ring-offset-surface' : 'bg-surface-2 text-faint'}`}>
            {i < idx && <CheckCircle className="w-3.5 h-3.5" />}
            <span>{i + 1}</span>
            <span className="hidden sm:inline">{STATUS_LABELS[step]}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`h-px w-8 mx-1 ${i < idx ? 'bg-brand-primary' : 'bg-line'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------- KPI Tile ----------
function KpiCard({ label, value, sub, color = 'default' }: { label: string; value: string | number; sub?: string; color?: 'default' | 'warning' | 'success' }) {
  const colorMap = { default: 'text-ink', warning: 'text-pill-amber-fg', success: 'text-pill-green-fg' }
  return (
    <div className="bg-surface rounded-[10px] border border-line shadow-[0_1px_2px_rgba(31,41,55,.04)] px-5 py-4">
      <p className="text-[11px] font-semibold text-faint uppercase tracking-[0.06em]">{label}</p>
      <p className={`text-[23px] font-semibold mt-1 tabular-nums ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-[11.5px] text-faint mt-0.5">{sub}</p>}
    </div>
  )
}

export default function CarbonTransactionsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { role } = useCurrentUser()
  const canCreate = can.createCarbon(role)
  const canManage = can.manageCarbon(role) // edit / delete / advance status
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<CarbonTx | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CarbonTx | null>(null)
  const [search, setSearch] = useState('')
  const [livePreview, setLivePreview] = useState<number | null>(null)

  const { data: transactions = [], isLoading } = useQuery<CarbonTx[]>({
    queryKey: ['carbon'], queryFn: () => fetch('/api/carbon').then(r => r.json()),
  })
  const { data: kpis } = useQuery<KpiData>({
    queryKey: ['carbon-kpis'], queryFn: () => fetch('/api/carbon?kpis=true').then(r => r.json()),
    refetchInterval: 30_000,
  })
  const { data: factors = [] } = useQuery<EmissionFactor[]>({
    queryKey: ['emission-factors'], queryFn: () => fetch('/api/emission-factors').then(r => r.json()),
  })
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'], queryFn: () => fetch('/api/departments').then(r => r.json()).then(d => d.departments ?? []),
  })

  const factorMap = useMemo(() => Object.fromEntries(factors.map(f => [f.id, f])), [factors])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q ? transactions.filter(t => t.reference.toLowerCase().includes(q) || t.sourceModule.toLowerCase().includes(q) || (t.product ?? '').toLowerCase().includes(q) || (t.departmentName ?? '').toLowerCase().includes(q)) : transactions
  }, [transactions, search])

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { sourceModule: 'Manual', product: '', quantity: 1, emissionFactorId: '', departmentId: '', date: new Date().toISOString().split('T')[0] },
  })

  const watchedFactorId = useWatch({ control, name: 'emissionFactorId' })
  const watchedQty = useWatch({ control, name: 'quantity' })

  useEffect(() => {
    const f = factorMap[watchedFactorId]; const q = Number(watchedQty)
    setLivePreview(f && q > 0 ? q * f.co2PerUnit : null)
  }, [watchedFactorId, watchedQty, factorMap])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, quantity: Number(values.quantity) }
      return selected ? apiPatch(`/api/carbon/${selected.id}`, payload) : apiPost('/api/carbon', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carbon'] })
      qc.invalidateQueries({ queryKey: ['carbon-kpis'] })
      toast({ title: selected ? 'Transaction updated' : 'Transaction logged' })
      closeDrawer()
    },
    onError: (e: ApiError) =>
      toast({ title: 'Save failed', description: e.message, variant: 'error' }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch(`/api/carbon/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carbon'] })
      qc.invalidateQueries({ queryKey: ['carbon-kpis'] })
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast({ title: 'Status updated' })
      closeDrawer()
    },
    onError: (e: ApiError) =>
      toast({ title: 'Update failed', description: e.message, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/carbon/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carbon'] })
      qc.invalidateQueries({ queryKey: ['carbon-kpis'] })
      toast({ title: 'Transaction deleted' })
      setDeleteTarget(null)
    },
    onError: (e: ApiError) =>
      toast({ title: 'Delete failed', description: e.message, variant: 'error' }),
  })

  const openCreate = () => { setSelected(null); reset({ sourceModule: 'Manual', product: '', quantity: 1, emissionFactorId: factors[0]?.id ?? '', departmentId: departments[0]?.id ?? '', date: new Date().toISOString().split('T')[0] }); setLivePreview(null); setDrawerOpen(true) }
  const openEdit = (item: CarbonTx) => { setSelected(item); reset({ sourceModule: item.sourceModule, product: item.product ?? '', quantity: item.quantity, emissionFactorId: item.emissionFactorId, departmentId: item.departmentId, date: new Date(item.date).toISOString().split('T')[0] }); setLivePreview(null); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setSelected(null); setLivePreview(null) }

  const nextAction = selected ? STATUS_NEXT[selected.status] : null
  const formDisabled = !!selected && !canManage // viewing an existing record you cannot edit
  const canSave = selected ? canManage : canCreate

  return (
    <div className="min-h-full animate-es-fade">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[20px] font-semibold text-ink">Carbon Transactions</h1>
          <p className="text-[12.5px] text-faint">{isLoading ? '…' : `${transactions.length} records`} · Track emissions across all departments</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 h-[34px] px-4 rounded-[7px] bg-brand-primary text-white text-[12.5px] font-semibold hover:bg-brand-primary-dark transition-colors">
            <Plus className="w-4 h-4" />Log Carbon Data
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total CO₂e This Month" value={`${(kpis?.totalCo2 ?? 0).toFixed(1)} kg`} sub="auto-calculated from emission factors" />
        <KpiCard label="Transactions This Month" value={kpis?.totalCount ?? 0} sub="logged across all modules" />
        <KpiCard label="Needs Review" value={kpis?.needsReviewCount ?? 0} color={kpis?.needsReviewCount ? 'warning' : 'default'} sub="transactions requiring action" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 h-[34px] px-2.5 bg-surface border border-line rounded-[7px] flex-1 max-w-xs">
          <Search className="w-4 h-4 text-faint shrink-0" />
          <input type="text" placeholder="Search reference, module, product…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-[12.5px] bg-transparent outline-none text-ink placeholder:text-faint" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-faint" /></button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-line shadow-[0_1px_2px_rgba(31,41,55,.04)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className="text-left text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">Reference</th>
              <th className="text-left text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">Module</th>
              <th className="text-left text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">Product</th>
              <th className="text-right text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">Quantity</th>
              <th className="text-right text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">CO₂e (kg)</th>
              <th className="text-left text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">Department</th>
              <th className="text-left text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">Date</th>
              <th className="text-left text-[11px] font-semibold text-faint uppercase tracking-[0.05em] px-[18px] py-2.5">Status</th>
              <th className="px-[18px] py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading ? [...Array(6)].map((_, i) => (
              <tr key={i}>{[...Array(9)].map((_, j) => <td key={j} className="px-[18px] py-3.5"><div className="h-4 bg-track rounded animate-es-shimmer w-3/4" /></td>)}</tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-5 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-tint-green flex items-center justify-center">
                    <span className="text-2xl">🌿</span>
                  </div>
                  <p className="text-sm font-medium text-ink-2">No carbon transactions yet</p>
                  <p className="text-xs text-faint">Log your first record manually or import from fleet and energy systems.</p>
                  {canCreate && <button onClick={openCreate} className="mt-1 px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-[7px] hover:bg-brand-primary-dark transition-colors">+ Log Carbon Data</button>}
                </div>
              </td></tr>
            ) : filtered.map(tx => (
              <tr key={tx.id} onClick={() => openEdit(tx)} className="hover:bg-accent-soft cursor-pointer transition-colors group">
                <td className="px-[18px] py-3.5 font-mono text-xs font-semibold text-brand-primary">{tx.reference}</td>
                <td className="px-[18px] py-3.5 text-[13px] text-ink">{tx.sourceModule}</td>
                <td className="px-[18px] py-3.5 text-[13px] text-ink">{tx.product ?? <span className="text-faint">—</span>}</td>
                <td className="px-[18px] py-3.5 text-right font-mono text-ink-2">{tx.quantity} {tx.emissionFactorUnit}</td>
                <td className="px-[18px] py-3.5 text-right font-semibold text-ink font-mono tabular-nums">{Number(tx.calculatedCo2).toFixed(1)}</td>
                <td className="px-[18px] py-3.5 text-ink-2 text-xs">{tx.departmentName ?? <span className="text-faint">—</span>}</td>
                <td className="px-[18px] py-3.5 text-ink-2 text-xs tabular-nums">{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-[18px] py-3.5"><StatusPill status={tx.status} /></td>
                <td className="px-[18px] py-3.5">
                  {canManage && (
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(tx) }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-pill-red-bg text-faint hover:text-pill-red-fg transition-all">
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
          <div className="w-[500px] max-w-[100vw] bg-surface border-l border-line shadow-[0_24px_60px_rgba(31,41,55,.20)] flex flex-col h-full animate-es-drawer">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line-soft">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  {selected ? selected.reference : 'New Carbon Transaction'}
                </h2>
                {selected && <div className="flex items-center gap-2 mt-1"><StatusPill status={selected.status} /></div>}
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-md hover:bg-hover text-faint hover:text-ink transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Step indicator for existing */}
              {selected && STATUS_STEPS.includes(selected.status) && <StepIndicator status={selected.status} />}

              <form className="space-y-5">
                <fieldset disabled={formDisabled} className="space-y-5 m-0 min-w-0 border-0 p-0">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-ink">Source Module <span className="text-pill-red-fg">*</span></label>
                  <select {...register('sourceModule')} className="w-full px-3 py-2 text-[13.5px] border border-input-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface text-ink transition">
                    {['Manual','Fleet','Purchase','Expense','Manufacturing'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-ink">Product / Description</label>
                  <input {...register('product')} placeholder="e.g. Diesel — Van #4, Grid electricity — HQ"
                    className="w-full px-3 py-2 text-[13.5px] border border-input-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface text-ink placeholder:text-faint transition" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-ink">Quantity <span className="text-pill-red-fg">*</span></label>
                    <input type="number" step="0.01" {...register('quantity', { required: true, valueAsNumber: true, validate: v => Number(v) > 0 || 'Must be > 0' })}
                      className="w-full px-3 py-2 text-[13.5px] border border-input-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface text-ink font-mono transition" />
                    {errors.quantity && <p className="text-xs text-pill-red-fg">Must be greater than 0</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-ink">Emission Factor <span className="text-pill-red-fg">*</span></label>
                    <select {...register('emissionFactorId', { required: true })} className="w-full px-3 py-2 text-[13.5px] border border-input-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface text-ink transition">
                      <option value="">— Select —</option>
                      {factors.filter(f => f.status === 'ACTIVE').map(f => <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>)}
                    </select>
                    {errors.emissionFactorId && <p className="text-xs text-pill-red-fg">Required</p>}
                  </div>
                </div>

                {/* Live CO₂ preview */}
                {livePreview !== null && (
                  <div className="flex items-center justify-between p-4 bg-tint-green border border-accent-line rounded-xl">
                    <div>
                      <p className="text-[11px] font-semibold text-brand-primary uppercase tracking-[0.06em]">Calculated CO₂e</p>
                      <p className="text-xs text-ink-2 mt-0.5">{watchedQty} × {factorMap[watchedFactorId]?.co2PerUnit} kg/unit · auto-calculated</p>
                    </div>
                    <p className="text-[23px] font-semibold text-ink tabular-nums">{livePreview.toFixed(1)} <span className="text-sm font-normal text-ink-2">kg</span></p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-ink">Department <span className="text-pill-red-fg">*</span></label>
                    <select {...register('departmentId', { required: true })} className="w-full px-3 py-2 text-[13.5px] border border-input-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface text-ink transition">
                      <option value="">— Select —</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {errors.departmentId && <p className="text-xs text-pill-red-fg">Required</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-ink">Date <span className="text-pill-red-fg">*</span></label>
                    <input type="date" {...register('date', { required: true })} className="w-full px-3 py-2 text-[13.5px] border border-input-line rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 bg-surface text-ink transition" />
                  </div>
                </div>

                {/* Status action */}
                {selected && nextAction && canManage && (
                  <div className="pt-2 border-t border-line-soft">
                    <p className="text-[11px] font-semibold text-faint uppercase tracking-[0.06em] mb-3">Actions</p>
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: selected.id, status: nextAction.next })}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[7px] border border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-60"
                    >
                      <nextAction.Icon className="w-4 h-4" />
                      {statusMutation.isPending ? 'Processing…' : nextAction.label}
                    </button>
                  </div>
                )}
                </fieldset>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-line-soft flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-sm font-semibold text-ink border border-line rounded-[7px] hover:bg-hover transition-colors">{canSave ? 'Discard' : 'Close'}</button>
              {canSave && (
                <button onClick={handleSubmit(v => saveMutation.mutate(v))} disabled={saveMutation.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-brand-primary rounded-[7px] hover:bg-brand-primary-dark disabled:opacity-60 transition-colors">
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface border border-line rounded-2xl shadow-[0_24px_60px_rgba(31,41,55,.24)] p-6 w-full max-w-sm mx-4 animate-es-fade">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-pill-red-bg rounded-xl shrink-0"><Trash2 className="w-5 h-5 text-pill-red-fg" /></div>
              <div>
                <h3 className="font-semibold text-ink">Delete transaction {deleteTarget.reference}?</h3>
                <p className="text-sm text-ink-2 mt-1">This removes the record and its {Number(deleteTarget.calculatedCo2).toFixed(1)} kg CO₂e from all reports. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-semibold text-ink border border-line rounded-[7px] hover:bg-hover">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-pill-red-fg rounded-[7px] hover:brightness-95 disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
