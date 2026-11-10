import * as React from "react"

import { cn } from "@/lib/utils"

/** A person: their photo, or their initials. Decorative: put their name in the text beside it. */
function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => Array.from(w)[0] ?? "").join("").toUpperCase() || "?"
  return (
    <span
      data-slot="avatar"
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-sm font-semibold text-primary-ink",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}

export { Avatar }
