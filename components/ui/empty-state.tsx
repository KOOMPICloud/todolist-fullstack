import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * What a list shows before it has anything: an icon, what will be here, and
 * the button that adds the first one.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center", className)}
    >
      {icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary-ink [&_svg]:size-6">{icon}</span>
      )}
      <div className="flex max-w-xs flex-col gap-1">
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
