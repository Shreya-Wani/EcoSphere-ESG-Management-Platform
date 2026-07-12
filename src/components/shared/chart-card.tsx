'use client'

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  )
}
