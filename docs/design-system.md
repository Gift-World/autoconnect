# AutoConnect design system

The bar: Airbnb's clarity, Uber's directness, tribbe's motion — in AutoConnect's own
motorsport palette: graphite black, bone white and racing yellow. Every page gets the same treatment, public or private.

## Principles (the "Musk cut")

1. **One page, one job, one primary button.** Everything else is secondary or tucked away
   (tabs, accordions, "More" menus, drawers). Never delete a feature — regroup it.
2. **Show the thing.** Cars, photos and numbers first; explanations second, short.
3. **Data everywhere.** Every list has a loading skeleton, a real empty state with a next step,
   and an error state. Never a blank box.
4. **Plain words.** Short sentences. No jargon, no hype claims we can't back.
5. **Mobile first.** Must work at 360px, 390px, 768px, 1024px, 1280px, 1440px+. No horizontal
   page scroll. Touch targets ≥ 44px. Tables become cards or scroll inside their own container
   (`overflow-x-auto`) below `md`.

## Palette (Tailwind classes)

Hard-coded `teal-*` now renders racing yellow and `slate-*` renders neutral graphite, app-wide. Never put yellow text on a light background; on light surfaces use black text on a yellow fill.
Prefer semantic tokens in new code:

| Role | Class |
|---|---|
| Page background | `bg-background` (bone white; graphite in dark) |
| Text | `text-foreground`, secondary `text-muted-foreground` |
| Primary action | `bg-ac-accent text-ac-ink` (racing yellow) or `bg-primary text-primary-foreground` (black) |
| Dark storytelling surface | `bg-ac-ink text-white` |
| Story panel colours | `bg-ac-cream`, `bg-ac-powder`, `bg-ac-apricot`, `bg-ac-stone` (always `text-ac-ink`) |
| Success / warning / error | `text-success`, `text-warning`, `text-destructive` (keep emerald/amber for status) |

Dark mode must keep working: use tokens (`bg-card`, `border-border`) for neutral surfaces.

## Type

- Display headings: `font-brand` (Bricolage Grotesque 800, tight). Page titles
  `text-3xl sm:text-5xl`; hero titles `text-4xl sm:text-6xl lg:text-7xl`.
- Section kicker: `brand-kicker text-muted-foreground` (or `text-ac-accent` on dark).
- Body: Inter, `text-base leading-7` for reading, `text-sm` for UI.

## Shape and spacing

- Big surfaces: `rounded-[28px] sm:rounded-[36px]`. Cards: `rounded-2xl`/`rounded-3xl`.
  Buttons and chips: `rounded-full`.
- Page gutters: `px-4 sm:px-6`, max width `max-w-[1360px] mx-auto`.
- Section rhythm: `py-16 sm:py-24` on public pages; dashboards tighter (`gap-4 sm:gap-6`).

## Images

- Always inside a fixed aspect box: `aspect-[4/3]` (cards), `aspect-[16/10]` (heroes),
  `aspect-square` (thumbs); image `h-full w-full object-cover`; `loading="lazy"` below the fold.
- Use `VehicleImage` for car photos (it handles fallbacks). Give every image meaningful `alt`.
- Never let an image set its own height in a grid.

## Motion (public storytelling pages only — never on forms or dashboards)

Reusable components in `src/components/motion/`:
- `RevealText` — words light up on scroll (manifestos, one per page max).
- `StackPanels` — pinned coloured panels for numbered steps (01–04).
- `ScrollCar3D` — pinned 3D-tilting photo stage with callouts.
- `FloatingStack` — pinned photo with cards stacking on top.

All respect `prefers-reduced-motion`. Pinned sections rely on `position: sticky`; never put
`overflow: hidden/auto` on an ancestor of a pinned section (use `overflow-x-clip`).

## Dashboards (seller, admin, account, garage)

Uber-driver-app clarity: a stat row at the top (3–4 big numbers), then the one list that needs
action, then everything else. Tables scroll horizontally inside their card on small screens.
Use `PageHeader` for every page title and `DashboardShell` for navigation.
