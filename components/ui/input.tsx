import * as React from "react"

import { cn } from "@/lib/utils"

/** The look every text control shares: 44px high, 16px text (phones don't zoom in on it). */
export const controlClass =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3.5 text-base text-foreground transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"

/** A text input. Give it the right type and inputMode (tel, email, numeric, decimal) for the phone's keyboard. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        controlClass,
        "h-11 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
