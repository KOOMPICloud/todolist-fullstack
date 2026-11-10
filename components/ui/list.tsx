import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/** Rows of things in one rounded surface, split by hairlines: the main pattern of an app's screens. */
function List({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="list"
      className={cn("divide-y overflow-hidden rounded-2xl border bg-card", className)}
      {...props}
    />
  )
}

/**
 * One thing in a List: what it is (title), one line of detail (description),
 * and what to scan for at the end (trailing: an amount, a time, a Badge).
 * With href it is a link, with onClick a button: the whole row is the target,
 * and controls in `leading` or `trailing` (a Checkbox, a Button) still work.
 * `icon` puts a lucide icon in a small tile; `leading` takes anything else
 * (an Avatar, a Checkbox, a picture).
 */
function ListRow({
  title,
  description,
  leading,
  icon,
  trailing,
  href,
  onClick,
  chevron,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  leading?: React.ReactNode
  icon?: React.ReactNode
  trailing?: React.ReactNode
  href?: string
  onClick?: () => void
  chevron?: boolean
  className?: string
}) {
  const target = href !== undefined || onClick !== undefined
  const stretch =
    "outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-[inherit] focus-visible:after:ring-[3px] focus-visible:after:ring-ring/45 focus-visible:after:ring-inset"
  const label = <span className="block truncate text-[15px] font-medium text-foreground">{title}</span>

  return (
    <li
      data-slot="list-row"
      className={cn(
        "relative flex min-h-16 items-center gap-3 px-4 py-3",
        target && "transition-colors duration-150 has-[[data-row-target]:hover]:bg-muted/60 has-[[data-row-target]:active]:bg-muted",
        className
      )}
    >
      {icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.8)] bg-muted text-foreground [&_svg]:size-[18px]">
          {icon}
        </span>
      )}
      {leading && <span className="relative z-10 flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {href !== undefined ? (
          <Link href={href} data-row-target className={stretch}>{label}</Link>
        ) : onClick ? (
          <button type="button" onClick={onClick} data-row-target className={cn(stretch, "cursor-pointer text-left")}>{label}</button>
        ) : (
          label
        )}
        {description && <span className="block truncate text-sm text-muted-foreground">{description}</span>}
      </span>
      {trailing && (
        <span className="relative z-10 flex shrink-0 items-center gap-2 text-sm text-muted-foreground tabular-nums">{trailing}</span>
      )}
      {(chevron ?? href !== undefined) && <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground/70" />}
    </li>
  )
}

/** A List of `rows` placeholder rows in the real rows' shape, while they load: never a blank screen. */
function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <ul aria-busy className={cn("divide-y overflow-hidden rounded-2xl border bg-card", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex min-h-16 items-center gap-3 px-4 py-3">
          <span className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-3.5 animate-pulse rounded-md bg-muted" style={{ width: `${[62, 48, 70, 55][i % 4]}%` }} />
            <span className="h-3 w-24 animate-pulse rounded-md bg-muted" />
          </span>
        </li>
      ))}
    </ul>
  )
}

export { List, ListRow, ListSkeleton }
