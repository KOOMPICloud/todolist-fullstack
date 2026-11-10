"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A label above its control, with help text or the error under it. Wraps one
 * control (Input, Select, Textarea, ChoiceChips, DayChips) and wires the
 * label, the help text and the error to it for screen readers.
 *
 *   <Field label="Phone" hint="We text you a reminder" error={errors.phone}>
 *     <Input type="tel" inputMode="tel" value={phone} onChange={...} />
 *   </Field>
 */
function Field({
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  className?: string
  children: React.ReactElement
}) {
  const id = React.useId()
  const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>
  const controlId = (child.props.id as string | undefined) ?? `${id}-control`
  const describedBy = [error ? `${id}-error` : hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined
  const control = React.cloneElement(child, {
    id: controlId,
    "aria-labelledby": `${id}-label`,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : child.props["aria-invalid"],
  })

  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <label id={`${id}-label`} htmlFor={controlId} className="text-sm font-medium text-foreground">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export { Field }
