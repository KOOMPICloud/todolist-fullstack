"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface Choice {
  value: string
  label: React.ReactNode
  /** A second, smaller line: a price, "2 left", a date. */
  hint?: React.ReactNode
  disabled?: boolean
}

/**
 * Pick one of a few choices, all in view: a service, a size, a time slot.
 * Better than a select or a raw date/time input when the choices are known.
 * layout: "wrap" (default), "grid" (time slots), "scroll" (one row that
 * scrolls sideways on a phone). Arrow keys move between choices.
 */
function ChoiceChips({
  options,
  value,
  onChange,
  layout = "wrap",
  className,
  ...props
}: {
  options: Choice[]
  value: string | null | undefined
  onChange: (value: string) => void
  layout?: "wrap" | "grid" | "scroll"
  className?: string
} & Omit<React.ComponentProps<"div">, "onChange">) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)
  const current = options.findIndex((o) => o.value === value)
  const focusable = current >= 0 && !options[current]!.disabled ? current : enabled[0]

  const move = (from: number, step: number) => {
    const at = enabled.indexOf(from)
    const next = enabled[(at + step + enabled.length) % enabled.length]
    if (next === undefined) return
    refs.current[next]?.focus()
    onChange(options[next]!.value)
  }

  return (
    <div
      role="radiogroup"
      data-slot="choice-chips"
      className={cn(
        layout === "grid" && "grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2",
        layout === "wrap" && "flex flex-wrap gap-2",
        layout === "scroll" &&
          "-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    >
      {options.map((o, i) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            tabIndex={i === focusable ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                move(i, 1)
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                move(i, -1)
              }
            }}
            className={cn(
              "flex min-h-11 shrink-0 cursor-pointer snap-start flex-col items-center justify-center gap-0.5 rounded-xl border bg-card px-4 py-2 text-[15px] font-medium text-foreground transition-[background-color,border-color,color,scale] duration-150 ease-standard outline-none select-none hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-ring/45 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border",
              selected && "border-primary bg-primary text-primary-foreground hover:border-primary"
            )}
          >
            <span className="leading-tight">{o.label}</span>
            {o.hint && (
              <span className={cn("text-xs leading-tight font-normal", selected ? "opacity-90" : "text-muted-foreground")}>{o.hint}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Today in a time zone, as YYYY-MM-DD. */
function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

/**
 * The next `days` days as chips (weekday over the date, scrolling sideways),
 * in Cambodia's time unless told otherwise; value is "YYYY-MM-DD". Use it
 * instead of <input type="date"> for a booking or a delivery day.
 * isDisabled(day) greys out days that can't be picked (closed on Sunday).
 */
function DayChips({
  value,
  onChange,
  days = 14,
  timeZone = "Asia/Phnom_Penh",
  locale = "en-GB",
  isDisabled,
  className,
  ...props
}: {
  value: string | null | undefined
  onChange: (day: string) => void
  days?: number
  timeZone?: string
  locale?: string
  isDisabled?: (day: string) => boolean
} & Omit<React.ComponentProps<"div">, "onChange">) {
  const options = React.useMemo(() => {
    const [y, m, d] = todayIn(timeZone).split("-").map(Number) as [number, number, number]
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
    const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
    return Array.from({ length: days }, (_, i): Choice => {
      const date = new Date(Date.UTC(y, m - 1, d + i))
      const iso = date.toISOString().slice(0, 10)
      const first = i === 0 || date.getUTCDate() === 1
      return {
        value: iso,
        label: i === 0 ? "Today" : weekday.format(date),
        hint: first ? `${date.getUTCDate()} ${month.format(date)}` : String(date.getUTCDate()),
        disabled: isDisabled?.(iso),
      }
    })
  }, [days, timeZone, locale, isDisabled])

  return <ChoiceChips layout="scroll" options={options} value={value} onChange={onChange} className={cn("[&>button]:min-w-[4.25rem] [&>button]:py-2.5", className)} {...props} />
}

/** Times from start to end ("09:00" to "18:00") every stepMinutes, for a grid of ChoiceChips. */
function timeSlots(start: string, end: string, stepMinutes = 30): string[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number) as [number, number]
    return h * 60 + m
  }
  const out: string[] = []
  for (let t = toMin(start); t <= toMin(end); t += stepMinutes) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`)
  }
  return out
}

export { ChoiceChips, DayChips, timeSlots }
