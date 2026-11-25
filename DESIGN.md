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
- Color does work on every screen, never a white page of grey cards with one colored button: the page is tinted, the side bar and top bar are colored (`bg-nav`), the current tab is a filled pill, buttons are pills.
- One feature block at the top of each tab's first screen: what matters now as one big number or line, in the feature fill. `<div className="d-spot"><div className="d-spot-value">3</div><p>to-dos left · 2 done</p></div>` (`components/todo/todo-app.tsx`). One a screen. `d-soft` is the quiet tint for a second highlight.
- Someone signed out sees the welcome page, not a card in the shell: `components/welcome.tsx` (`d-public` hides the side bar and the bars; the app's name huge in the feature fill, what it does for them, one sign-in button, three true facts). Change its words for the app; other public pages (a shared link, a profile) are `d-public` too.
- Text on a fill is its `-foreground` token; muted text never lighter than `text-muted-foreground`.
- Type: `text-title` (a screen, big and bold), `text-heading` (a section), 15 to 16px text, `text-sm` details, `text-xs` badges; `d-spot-value` for the one big number.
- Space groups: a title close to its detail, sections apart. Fewer boxes: no card in a card.
- One filled button per view; a row is itself the target (no button on every row).
- lucide-react icons, one size per place. A row's icon only when it differs from row to row; never emoji or text symbols as icons, no sparkles for AI.
- Samples marked once and small: a neutral `Badge` in `trailing`, or a line above the list.

## Phones first

- Build at 390px wide first: nothing scrolls sideways or hides under the tab bar.
- Everything tappable is 44px or more; inputs have 16px text (no zoom); the right keyboard (`type="tel"`, `inputMode="numeric"`, `autoComplete`).
- The main action under the thumb: the Screen's `action` on a wide screen, a full-width button under the list on a phone (`components/todo/todo-app.tsx`).
- Khmer: `lang="km"` on it, for its taller lines.

## Fast for many visitors

The app may run as several copies at once, and each deploy starts it afresh.

- Rows link with `ListRow href` (no prefetch). A `<Link>` of your own in a `.map` gets `prefetch={false}`: Next fetches each link in view ahead of a click, a request per row for every visitor. The shell's nav links keep their prefetch.
- What lasts goes in the database (`lib/db.ts`, one client for the app): sessions, codes, carts, counters. A `Map` in a route is lost at each deploy and missing on the other copies.
- Uploads go in a bucket (create_bucket or connect_bucket), never the app's own folder.
- Pictures: import them (`import hero from './hero.jpg'` gets a hashed name, kept a year). For files in `public/`, a `Cache-Control` of `public, max-age=0, s-maxage=86400` in `next.config.js` `headers()` lets the KOOMPI Cloud edge network keep them until the next deploy.
- Never `public` or `s-maxage` on what depends on who asks (`/api/me`, a person's list, anything after sign-in): the edge would give one person's answer to everyone.
- Refresh a list every 15 s or more, and not while the tab is hidden; after a change, load it again once.

## States

Every list: loading (`ListSkeleton`), empty (`EmptyState` with the button that fills it), errors that say what to do, a toast after each change. A busy button says so ("Booking…"). Deleting asks once more (`components/todo/todo-item.tsx`).

## Signing in

A button whose action needs an account (Pay, Book, Order, Comment, Save, Add) works for someone signed out too: it starts Sign in with KOOMPI ID itself and finishes the action after, with what they chose. Never "please sign in" text, a disabled button, or a sign-in screen in its place.

```tsx
import { requireSignIn, useResumeAfterSignIn } from '@/lib/require-sign-in';

const book = async (slot: string) => {
  if (!requireSignIn('book', { slot })) return; // signing in; useResumeAfterSignIn books it once they are back
  await api.book(slot);
  toast.success('Booked');
};
useResumeAfterSignIn<{ slot: string }>('book', ({ slot }) => book(slot));
```

- `requireSignIn` first in the click handler, before any `await`. The payload is plain values, plus `File`s at its top level (a photo).
- A form that signs in first stays open with what was typed, in case they cancel (`components/todo/add-todo-form.tsx`). `useResumeAfterSignIn`'s third argument waits until the page has loaded what the action changes (`components/todo/todo-app.tsx`, `support-card.tsx`).
- A page that is all the person's own (their to-dos, their bookings, their account) shows the welcome page with its one "Sign in with KOOMPI ID" button (`components/welcome.tsx`).

## Never

- Nav spread down the side bar (`justify-between`), or the screen's title beside the app's name in a bar.
- Two light/dark icons at once, or theme code of your own: the `<head>` script and `ThemeToggle` do it, with no hydration warning.
- A form or a list across a whole wide screen.
- Black text on a saturated button; a gradient or glow anywhere but the feature fill (`d-spot`, the welcome page).
- A grey side bar, white cards with a thin border and one colored button: the plain look of a component kit.
- Raw `<input type="date">` or `type="time"` when the choices are known.
- Capitals with letter-spacing as labels; three identical cards in a row; lorem ipsum.
- Building your own origin from `request.url` for payment or sign-in return addresses: use `appOrigin()` (`lib/payments.ts`).
- "Sign in to …" text, or a disabled button, where the action could sign in itself (Signing in).

## Changing the look

KOOMPI Cloud's design_app adds `design.css`: its colors, fonts and corners reach every component through the same variables. By hand, change `--hue` in `app/globals.css` (one number, 0 to 360: every color is a tone of it), or a token (`--primary`, `--radius`) in both `:root` and `.dark`, keeping its contrast.

- Add to `app/globals.css`, never replace it: its `@import`s, the tokens in `:root` and `.dark`, and `@theme inline` are where every component's classes come from. Your own styles go after them, or in a stylesheet of your own imported with `./` (`@import './shop.css';`: without `./` Tailwind looks for a package).
- Import only packages in `package.json` (add one with install_packages first). Never `shadcn/tailwind.css`: this app has no `shadcn` package, and `globals.css` already has what its components need.

---

Some rules are adapted from the Stageshow skill in [benjitaylor/skills](https://github.com/benjitaylor/skills) (MIT License, Copyright (c) 2026 Benji Taylor).
