import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * The light/dark switch: one icon, the mode it switches to. The theme script
 * in the layout's <head> handles the click (data-theme-toggle) and remembers
 * it, and CSS picks the icon, so the server and the browser render the same
 * button: no hydration warning. Never read the theme in React to choose the
 * icon, and never write another theme switch.
 */
function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      data-theme-toggle
      aria-label="Dark mode"
      title="Light or dark"
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground hover:text-foreground", className)}
    >
      <Moon aria-hidden className="dark:hidden" />
      <Sun aria-hidden className="hidden dark:block" />
    </button>
  )
}

export { ThemeToggle }
