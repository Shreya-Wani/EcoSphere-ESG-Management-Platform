'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { KpiTile } from '@/components/shared/kpi-tile'
import { ChartCard } from '@/components/shared/chart-card'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusPill } from '@/components/shared/status-pill'
import { ReportChrome, rangeStart, type TimeRange } from '@/components/shared/report-chrome'
import { apiGet } from '@/lib/api'
import { downloadCsv } from '@/lib/csv'
import { formatDate } from '@/lib/utils'
import type { Scoreboard } from '@/server/services/score/read'

type CarbonTx = {
  id: string
  reference: string
  sourceModule: string
  product: string | null
  quantity: number
  calculatedCo2: number
  departmentName: string | null
  emissionFactorUnit: string | null
  date: string
  status: string
}

export default function EnvironmentalReportPage() {
  const [range, setRange] = useState<TimeRange>('fy')

  const { data: board } = useQuery<Scoreboard>({
    queryKey: ['scoreboard'],
    queryFn: () => apiGet<Scoreboard>('/api/scoreboard'),
  })
  const { data: txns = [], isLoading } = useQuery<CarbonTx[]>({
    queryKey: ['carbon'],
    queryFn: () => apiGet<CarbonTx[]>('/api/carbon'),
  })

  const filtered = useMemo(() => {
    const start = rangeStart(range).getTime()
    return txns.filter((t) => new Date(t.date).getTime() >= start)
  }, [txns, range])

  const totalCo2 = filtered.reduce((a, t) => a + Number(t.calculatedCo2 || 0), 0)
  const needsReview = filtered.filter((t) => t.status === 'NEEDS_REVIEW').length

  // CO₂e by department for the selected range, so the chart moves with the
  // filter (dept pillar scores are a point-in-time snapshot, not range-based).
  const chart = useMemo(() => {
    const byDept = new Map<string, number>()
    for (const t of filtered) {
      const key = t.departmentName ?? 'Unassigned'
      byDept.set(key, (byDept.get(key) ?? 0) + Number(t.calculatedCo2 || 0))
    }
    return Array.from(byDept, ([name, co2]) => ({ name, co2: Math.round(co2) })).sort(
      (a, b) => b.co2 - a.co2,
    )
  }, [filtered])

  const exportCsv = () =>
    downloadCsv(
      `environmental-report-${range}.csv`,
      filtered.map((t) => ({
        Reference: t.reference,
        Module: t.sourceModule,
        Product: t.product ?? '',
        Quantity: t.quantity,
        CO2e_kg: Number(t.calculatedCo2).toFixed(1),
        Department: t.departmentName ?? '',
        Date: formatDate(new Date(t.date)),
        Status: t.status,
      })),
    )

  const columns: Column<CarbonTx>[] = [
    {
      key: 'reference',
      label: 'Reference',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-brand-primary">{v as string}</span>
      ),
    },
    { key: 'sourceModule', label: 'Module' },
    { key: 'product', label: 'Product', render: (v) => (v as string) ?? '—' },
    {
      key: 'calculatedCo2',
      label: 'CO₂e (kg)',
      render: (v) => <span className="font-medium">{Number(v as number).toFixed(1)}</span>,
    },
    { key: 'departmentName', label: 'Department', render: (v) => (v as string) ?? '—' },
    { key: 'date', label: 'Date', render: (v) => formatDate(new Date(v as string)) },
    { key: 'status', label: 'Status', render: (v) => <StatusPill status={v as string} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Environmental Report"
        subtitle="Carbon transactions and Environmental pillar performance."
      />
      <ReportChrome range={range} onRange={setRange} onExport={exportCsv} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Avg Environmental Score" value={Math.round(board?.overall.environmental ?? 0)} />
        <KpiTile label="Total CO₂e (kg)" value={Math.round(totalCo2)} />
        <KpiTile label="Transactions" value={filtered.length} />
        <KpiTile label="Needs Review" value={needsReview} />
      </div>

      <div className="mb-6">
        <ChartCard title="CO₂e by Department (selected range)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" />
              <Tooltip cursor={{ fill: 'rgba(79,122,90,0.08)' }} />
              <Bar dataKey="co2" radius={[6, 6, 0, 0]}>
                {chart.map((_, i) => (
                  <Cell key={i} fill="#8fb89a" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <DataTable columns={columns} data={filtered} loading={isLoading} />
      </div>
    </div>
  )
}
