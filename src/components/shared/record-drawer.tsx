'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

type DrawerSize = 'md' | 'lg'

const sizeMap: Record<DrawerSize, string> = {
  md: 'w-full sm:w-[500px]',
  lg: 'w-full sm:w-[720px]',
}

interface RecordDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  size?: DrawerSize
  onSave?: () => void | Promise<void>
  onDiscard?: () => void
  loading?: boolean
  /**
   * When true the drawer becomes a read-only detail view: every form control
   * inside is disabled (native `<fieldset disabled>`) and the Save button is
   * replaced by a single Close button. Used so records stay clickable for
   * roles that can view but not edit them.
   */
  readOnly?: boolean
  saveLabel?: string
}

export function RecordDrawer({
  open,
  onOpenChange,
  title,
  children,
  size = 'md',
  onSave,
  onDiscard,
  loading = false,
  readOnly = false,
  saveLabel = 'Save',
}: RecordDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={sizeMap[size]}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
          <div className="flex-1 py-6">{children}</div>
        </fieldset>

        <SheetFooter className="-mx-6 -mb-6 flex gap-2 border-t border-line-soft bg-surface px-6 py-4">
          {readOnly ? (
            <Button variant="outline" onClick={onDiscard} disabled={loading}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onDiscard} disabled={loading}>
                Discard
              </Button>
              <Button onClick={onSave} disabled={loading}>
                {loading ? 'Saving...' : saveLabel}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
