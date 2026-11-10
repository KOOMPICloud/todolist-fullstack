# Design guide

How this app's screens are built: read it before building or changing one. Build from the components in `components/ui/` (the to-do screens use them), never hand-made lookalikes.

## The frame

- `app/layout.tsx` wraps every page in `<AppShell brand nav actions>`: `brand` is the app's name; `nav` its 2 to 5 main places, `{ href, label, icon: <CalendarDays /> }`, each a route (`app/bookings/page.tsx`). A tab bar on phones, a side bar from 1024px.
- A page returns `<Screen title description action width>`; its title is the page's only h1. The bar has the app's name, the screen its title: never the same words twice in view.
- `width`: `list` (default, 672px), `form` (512px: a form never stretches across a wide screen), `wide` (tables).
- `<Section title action>` groups a screen's parts, 24px apart. Titles in sentence case ("Coming up"), never capitals with letter-spacing.

## Components (`@/components/ui/…`)

| Need | Use |
| --- | --- |
| Rows of things | `List` of `ListRow title description leading icon trailing href onClick` (onClick only in a `'use client'` file) |
| A summary, a total | `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` |
| A form, details, a confirmation | `Sheet` > `SheetContent` > `SheetHeader` (`SheetTitle`), `SheetBody`, `SheetFooter` |
| A labelled field | `Field label hint error optional` around one `Input`, `Textarea`, `Select`, `ChoiceChips`, `DayChips` |
| One of a few choices | `ChoiceChips options value onChange layout="wrap" \| "grid" \| "scroll"` |
| A day, a time | `DayChips value onChange isDisabled`; `ChoiceChips layout="grid"` of `timeSlots('09:00', '18:00', 30)` |
| Views of a screen | `Segmented` (Upcoming / Past) |
| Status, person, nothing yet, loading | `Badge variant`, `Avatar name src`, `EmptyState icon title description action`, `ListSkeleton` |
| Actions | `Button variant="default" \| "tinted" \| "secondary" \| "outline" \| "ghost" \| "destructive" \| "link" size="sm" \| "lg" \| "icon"` |
| After a change | `toast.success('Booking sent')` (from `sonner`) |
| Dates, times, money | `formatDay`, `formatTime`, `formatMoney` from `@/lib/format` (Phnom Penh time, `$` and `៛`) |

```tsx
<Screen title="Bookings" description="3 today" action={<Button onClick={add}><Plus />New booking</Button>}>
  {loading ? <ListSkeleton /> : bookings.length ? (
    <List>{bookings.map((b) => (
      <ListRow key={b.id} leading={<Avatar name={b.name} />} title={b.name} description={`${b.service} · ${formatTime(b.at)}`}
        trailing={<Badge variant="success">Confirmed</Badge>} onClick={() => setOpen(b)} />
    ))}</List>
  ) : <EmptyState icon={<CalendarDays />} title="No bookings yet" description="New bookings show up here." action={<Button onClick={add}>New booking</Button>} />}
</Screen>

<SheetBody>
  <Field label="Day"><DayChips value={day} onChange={setDay} isDisabled={(d) => new Date(d).getUTCDay() === 0} /></Field>
  <Field label="Time" hint="Phnom Penh time"><ChoiceChips layout="grid" value={time} onChange={setTime}
    options={timeSlots('09:00', '17:30').map((t) => ({ value: t, label: t, disabled: taken.has(t) }))} /></Field>
  <Field label="Phone" error={errors.phone}><Input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
</SheetBody>
<SheetFooter><Button size="lg" className="w-full sm:w-auto" disabled={sending}>{sending ? 'Booking…' : `Book for ${time}`}</Button></SheetFooter>
```

## Look

- Colors only through the tokens in `app/globals.css`: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `bg-primary` + `text-primary-foreground` (the main button, the selection), `text-primary-ink` (colored text, links), `bg-primary/12` (a tint), `text-success`, `text-warning`, `text-destructive`. Never hex colors, `text-black`, `bg-white` or `gray-*`: they break dark mode and the look design_app gives the app.
- One accent, for one thing per view. Text on a fill is its `-foreground` token; muted text never lighter than `text-muted-foreground`.
- Type: `text-title` (a screen), `text-heading` (a section), 15 to 16px text, `text-sm` details, `text-xs` badges. Hierarchy from weight and space, not many sizes.
- Space groups: a title close to its detail, sections apart. Fewer boxes: no card in a card.
- One filled button per view; a row is itself the target (no button on every row).
- lucide-react icons, one size per place. A row's icon only when it differs from row to row; never emoji or text symbols as icons, no sparkles for AI.
- Samples marked once and small: a neutral `Badge` in `trailing`, or a line above the list.

## Phones first

- Build at 390px wide first: nothing scrolls sideways or hides under the tab bar.
- Everything tappable is 44px or more; inputs have 16px text (no zoom); the right keyboard (`type="tel"`, `inputMode="numeric"`, `autoComplete`).
- The main action under the thumb: the Screen's `action` on a wide screen, a full-width button under the list on a phone (`components/todo/todo-app.tsx`).
- Khmer: `lang="km"` on it, for its taller lines.

## States

Every list: loading (`ListSkeleton`), empty (`EmptyState` with the button that fills it), errors that say what to do, a toast after each change. A busy button says so ("Booking…"). Deleting asks once more (`components/todo/todo-item.tsx`).

## Never

- Nav spread down the side bar (`justify-between`), or the screen's title beside the app's name in a bar.
- Two light/dark icons at once, or theme code of your own: the `<head>` script and `ThemeToggle` do it, with no hydration warning.
- A form or a list across a whole wide screen.
- Black text on a saturated button; gradients, glows, glass blur.
- Raw `<input type="date">` or `type="time"` when the choices are known.
- Capitals with letter-spacing as labels; three identical cards in a row; lorem ipsum.
- Building your own origin from `request.url` for payment or sign-in return addresses: use `appOrigin()` (`lib/payments.ts`).

## Changing the look

KOOMPI Cloud's design_app adds `design.css`: its colors, fonts and corners reach every component through the same variables. By hand, change a token in `app/globals.css` (`--primary`, `--radius`) in both `:root` and `.dark`, keeping its contrast.

---

Some rules are adapted from the Stageshow skill in [benjitaylor/skills](https://github.com/benjitaylor/skills) (MIT License, Copyright (c) 2026 Benji Taylor).
