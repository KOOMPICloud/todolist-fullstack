import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * One `default` (filled) button per screen or sheet: its main action. The
 * rest are `tinted`, `secondary`, `outline` or `ghost`. Heights: sm 36px,
 * default 44px (the smallest comfortable touch target), lg 48px.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg text-[15px] font-medium whitespace-nowrap transition-[background-color,color,box-shadow,scale] duration-150 ease-standard outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/45 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary)_88%,black)]",
        tinted: "bg-primary/12 text-primary-ink hover:bg-primary/18",
        secondary:
          "bg-muted text-foreground hover:bg-[color-mix(in_oklab,var(--muted)_92%,var(--foreground))]",
        outline: "border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/16",
        link: "text-primary-ink underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 gap-1.5 px-3 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
