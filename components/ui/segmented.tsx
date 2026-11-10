"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Switch between views of one screen: Upcoming / Past, Open / Done, Day /
 * Week. Two to four short labels; for the app's main places use the tabs.
 */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...props
}: {
  options: Array<{ value: T; label: React.ReactNode }>
  value: T
  onChange: (value: T) => void
  className?: string
} & Omit<React.ComponentProps<"div">, "onChange">) {
  return (
    <div
      role="radiogroup"
      data-slot="segmented"
      className={cn("inline-flex w-full rounded-[min(var(--pill),0.875rem)] bg-muted p-1 sm:w-auto sm:self-start", className)}
      {...props}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 flex-1 cursor-pointer rounded-[min(var(--pill),0.625rem)] px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow] duration-150 ease-standard outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 sm:flex-none",
              selected && "bg-card text-foreground shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_oklch(0_0_0/0.03)] dark:bg-[color-mix(in_oklab,var(--muted)_72%,var(--foreground))]"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export { Segmented }
