import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** A short status or tag: Confirmed, Paid, New. Color only when it means something. */
const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-pill px-2.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary/12 text-primary-ink",
        success: "bg-success/12 text-success",
        warning: "bg-warning/14 text-warning",
        danger: "bg-destructive/10 text-destructive",
        solid: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
