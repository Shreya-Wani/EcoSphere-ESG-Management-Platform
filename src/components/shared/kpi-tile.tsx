'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'

interface KpiTileProps {
  label: string
  value: string | number
  delta?: number // positive = up, negative = down
}

export function KpiTile({ label, value, delta }: KpiTileProps) {
  const isPositive = delta !== undefined && delta >= 0

  return (
    <div className="flex min-h-[104px] flex-col gap-2 rounded-[10px] border border-line bg-surface p-[16px_18px] shadow-[0_1px_2px_rgba(31,41,55,.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
        {label}
      </p>
      <div className="mt-auto flex items-end gap-2">
        <div className="text-[23px] font-semibold tabular-nums text-ink">{value}</div>
        {delta !== undefined && (
          <div
            className={`flex items-center gap-1 pb-1 text-[11.5px] font-semibold ${
              isPositive ? 'text-pill-green-fg' : 'text-pill-red-fg'
            }`}
          >
            {isPositive ? <ArrowUp className="h-[13px] w-[13px]" /> : <ArrowDown className="h-[13px] w-[13px]" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
    </div>
  )
}
