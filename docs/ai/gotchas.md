# Gotchas (found the hard way — verified with Playwright, not just typecheck)

## shadcn/ui here is built on **Base UI**, not Radix

`components.json` uses `@base-ui/react`. Several Radix-isms silently don't work:

- **No `onSelect` on `DropdownMenuItem`.** Use `onClick`. `onSelect` type-checks fine (it's a generic React `HTMLAttributes` prop) but never fires on a `<div>`-based menu item — every dropdown action (edit/delete, vehicle switcher) was a dead click until this was caught.
- **No `asChild`.** Use `render={<RealElement>...</RealElement>}` instead (e.g. `<DropdownMenuTrigger render={<Button>...</Button>} />`).
- **`Button` defaults to `nativeButton: true`** (expects to render a real `<button>`). If you pass `render={<Link>...</Link>}` (an `<a>`), also pass `nativeButton={false}`, or Base UI logs an accessibility warning. For a disabled-looking Link (e.g. pagination boundaries), don't rely on `disabled` on an anchor — it doesn't do anything; render a real disabled `<Button>` instead of a Link at that boundary.
- **`ToggleGroup` value is always an array**, even in single-select mode (`multiple` defaults to `false`). `value={[fuelType]}`, `onValueChange={(values) => values[0] && setFuelType(values[0])}`.

## ESLint

Next.js 16 removed the `next lint` command entirely. `eslint-config-next`'s `FlatCompat`-wrapped legacy config also crashes eslint 9 with a circular JSON error the moment there's anything to report. Use the package's native flat exports instead: `eslint-config-next/core-web-vitals` and `/typescript`, run via plain `eslint .`. Already fixed in `eslint.config.mjs` — don't reintroduce `FlatCompat`.

## Recharts + dark mode

`<Tooltip>` renders a hardcoded white content box by default — doesn't follow the CSS theme. Always pass `contentStyle`/`labelStyle`/`itemStyle` from `src/components/charts/tooltip-style.ts` (references `--popover`/`--border` CSS vars) rather than letting a new chart use Recharts' defaults.

## Cloudflare Worker build (`wrangler dev` / deployed), not plain `next dev`

next-themes' inline flash-prevention script throws `ReferenceError: __name is not defined` in the browser console, only under the actual OpenNext Cloudflare Worker build — not `next dev`, not plain `next build && next start`. Confirmed via Playwright that hydration and all interactivity still work despite it (login, dropdowns, theme toggle all function). This is an upstream `@opennextjs/cloudflare` static-asset bundling artifact, not application code — don't spend time trying to "fix" it in feature work; it's tracked in the README's Known Issues section. Worth re-checking after an `@opennextjs/cloudflare` version bump.

## Hydration guard pattern (`ThemeToggle`, anything reading client-only state)

The `useEffect(() => setMounted(true), [])` pattern to avoid SSR/client theme mismatch trips the `react-hooks/set-state-in-effect` lint rule. This is the correct, standard pattern (next-themes' own docs recommend it) — suppress with a scoped `eslint-disable-next-line` and a comment, don't contort the code to avoid the rule.
