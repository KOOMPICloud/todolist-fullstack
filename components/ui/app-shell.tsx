"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface NavItem {
  href: string
  label: string
  /** A lucide-react icon element: <CalendarDays />. */
  icon: React.ReactNode
}

/**
 * The app's frame, in app/layout.tsx around every page: the app's 2 to 5
 * main places (nav) as a tab bar at the bottom on a phone and a side bar on
 * a wide screen (lg, 1024px and up), the name (brand) in the top bar on a
 * phone and at the top of the side bar, and `actions` (the ThemeToggle) next
 * to it. A page puts its title in <Screen title>, never in the bar: the
 * bar has the app's name, the screen has its title, once each.
 */
function AppShell({
  brand,
  nav,
  actions,
  children,
}: {
  brand: React.ReactNode
  nav: NavItem[]
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? "/"
  const current = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div data-slot="app-shell" className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card lg:flex">
        <div className="flex h-16 shrink-0 items-center px-6 font-display text-lg font-semibold tracking-tight">
          <span className="truncate">{brand}</span>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 px-3 pt-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current(item.href) ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/45 [&_svg]:size-5 [&_svg]:shrink-0",
                current(item.href) && "bg-primary/10 text-primary-ink hover:bg-primary/14 hover:text-primary-ink"
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        {actions && <div className="mt-auto flex items-center gap-1 border-t px-3 py-3">{actions}</div>}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 box-content border-b bg-background pt-[env(safe-area-inset-top)] pr-2 pl-4 lg:hidden">
          <span className="min-w-0 flex-1 truncate font-display text-[17px] font-semibold tracking-tight">{brand}</span>
          {actions}
        </header>
        <main className="flex-1 px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          {children}
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
      >
        <div className="mx-auto flex max-w-md gap-1 rounded-[min(var(--pill),1.75rem)] border bg-card p-1.5 shadow-float">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current(item.href) ? "page" : undefined}
              className={cn(
                "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[min(var(--pill),1.375rem)] text-[11px] leading-none font-medium text-muted-foreground transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 [&_svg]:size-[22px] [&_svg]:shrink-0",
                current(item.href) && "bg-primary/12 text-primary-ink"
              )}
            >
              {item.icon}
              <span className="max-w-full truncate px-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

const WIDTHS = { list: "max-w-2xl", form: "max-w-lg", wide: "max-w-5xl" } as const

/**
 * A page's content: its title (the only h1), a line under it, its main
 * action on the right, then its sections, 24px apart. width: "list" (672px,
 * the default), "form" (512px: a form never stretches across a wide
 * screen), "wide" (a dashboard or a table).
 */
function Screen({
  title,
  description,
  action,
  width = "list",
  className,
  children,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  width?: keyof typeof WIDTHS
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div data-slot="screen" className={cn("mx-auto flex w-full flex-col gap-6", WIDTHS[width], className)}>
      {(title || action) && (
        <header className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            {title && <h1 className="text-title">{title}</h1>}
            {description && <p className="text-[15px] text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      {children}
    </div>
  )
}

/** A group on a screen: a short sentence-case title (h2), an optional link or button beside it, then its List or Cards. */
function Section({
  title,
  action,
  className,
  children,
}: {
  title?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <section data-slot="section" className={cn("flex flex-col gap-3", className)}>
      {(title || action) && (
        <div className="flex min-h-9 items-center justify-between gap-3">
          {title && <h2 className="text-heading">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export { AppShell, Screen, Section }
