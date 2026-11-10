"use client"

import { useSyncExternalStore } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// The theme the page shows (the class the theme script puts on <html>).
const watch = (change: () => void) => {
  const observer = new MutationObserver(change)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}
const shown = () => (document.documentElement.classList.contains("dark") ? "dark" : "light")

/** Toasts: a short line after a change ("Booking sent"), top center, in the app's colors. */
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useSyncExternalStore(watch, shown, () => "light" as const)

  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset={{ top: "max(1rem, env(safe-area-inset-top))" }}
      mobileOffset={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px] text-success" />,
        info: <InfoIcon className="size-[18px] text-primary-ink" />,
        warning: <TriangleAlertIcon className="size-[18px] text-warning" />,
        error: <OctagonXIcon className="size-[18px] text-destructive" />,
        loading: <Loader2Icon className="size-[18px] animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "min(calc(var(--radius) * 1.34), 1rem)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: "shadow-float! text-[15px]!", description: "text-muted-foreground!" } }}
      {...props}
    />
  )
}

export { Toaster }
