# Original product spec (historical reference only)

This is the full spec the project was originally built from. **Every item in it is implemented** — see the root `README.md` and this folder's other docs for the current state. Don't treat this as a live task list; it's kept only so future agents can see the original intent behind a design decision if needed.

---

# Mileage Tracker — Complete Project Specification

You are a senior full-stack engineer and UX designer.

Your task is to build a production-quality web application called **Mileage Tracker**.

The goal is to create a beautiful, fast and highly polished fuel consumption tracker for personal use.

This application is **single-tenant** and will only be used by one person.

The application should feel like a native Apple application, with an emphasis on simplicity, whitespace, subtle animations and excellent UX.

---

# Tech Stack

Use ONLY the following technologies:

- Next.js (latest, App Router)
- TypeScript
- React
- TailwindCSS
- shadcn/ui
- Recharts
- Drizzle ORM
- Cloudflare D1
- Cloudflare Workers
- Cloudflare Pages
- next-safe-action
- Zod

Do NOT use:

- Prisma
- Supabase
- Firebase
- Clerk
- Auth.js
- External backend

Everything must run entirely on Cloudflare.

---

# Authentication

The application has only one user.

Authentication is intentionally simple.

There is an environment variable:

```
AUTH_TOKEN=my-super-secret-token
```

The login page asks only for the token.

If the token matches:

- create a secure HttpOnly cookie
- redirect to Dashboard

If invalid:

- display an error

No user table.

No passwords.

No OAuth.

No JWT.

---

# Database

Use Cloudflare D1 with Drizzle ORM.

Create migrations.

The application supports multiple vehicles.

---

## Vehicle

Fields:

- id
- name
- thumbnailUrl
- createdAt

Nothing else is required.

Example:

```
Civic
Corolla
Nivus
```

---

## FillUp

Fields:

- id
- vehicleId
- createdAt
- date
- odometerKm
- liters
- totalPrice
- fuelType
- isFullTank
- notes (nullable)

Indexes:

- vehicleId
- date
- odometerKm

Fuel types:

- gasoline
- ethanol
- diesel
- flex
- cng

---

# Initial Data

There is NO CSV import/export.

Instead, create a seed system.

A JSON file will be provided in this format:

Use data.json

Create a seed command:

```
npm run db:seed
```

The seed should:

- create the configured vehicle if it doesn't exist (default to HRV)
- import all fill-ups
- ignore the provided calculated fields
- recompute every statistic after import

---

# Business Rules

Consumption is ALWAYS calculated by the application.

Never trust imported values.

Whenever a fill-up is:

- created
- edited
- deleted

recalculate all affected metrics.

---

## Distance

Distance since previous fill-up:

```
current.odometer - previous.odometer
```

---

## Fuel Consumption

Consumption is calculated ONLY between TWO FULL TANKS.

Example:

Full

450 km

40 L

Partial

700 km

10 L

Full

900 km

25 L

Consumption:

```
(900 - 450) / (10 + 25)
```

Partial refuels contribute fuel.

Only a new full tank generates a consumption value.

Implement this correctly.

---

# Pages

## Login

Simple login.

Centered card.

Token input.

---

## Dashboard

Dashboard is always scoped to the selected vehicle.

Display:

- Vehicle thumbnail
- Vehicle name
- Average km/L
- Average fuel price
- Average cost/km
- Total spent
- Total liters
- Distance traveled
- Number of fill-ups
- Days since last fill-up
- Estimated autonomy

Charts:

- Consumption over time
- Fuel price over time
- Monthly spending
- Monthly liters consumed

Recent fill-ups table.

---

## Fill-ups

Sortable table.

Columns:

- Date
- Odometer
- Fuel type
- Liters
- Total Price
- Price/L
- Full Tank
- Consumption
- Actions

Actions:

- Edit
- Delete

Include:

- Search
- Pagination

---

## Add Fill-up

Fields:

- Vehicle
- Date
- Odometer
- Fuel Type
- Liters
- Total Price
- Full Tank
- Notes

Price per liter should be calculated automatically.

Fuel type should use an Apple-style segmented control built with shadcn ToggleGroup.

Validation must use Zod.

---

## Edit Fill-up

Reuse the same form.

---

## Delete

Use AlertDialog confirmation.

---

## Statistics

Generate:

- Average km/L
- Best consumption
- Worst consumption
- Average fuel price
- Average cost/km
- Monthly spending
- Yearly spending
- Distance traveled
- Fuel consumed
- Average monthly distance
- Average monthly spending

All statistics must respect the selected vehicle.

---

## Vehicles

Dedicated page.

Allow:

- Create
- Edit
- Delete

Fields:

- Name
- Thumbnail URL

Display vehicles as beautiful Apple-like cards.

Selecting a vehicle immediately refreshes every dashboard and statistic.

---

# Navigation

Desktop:

Left sidebar.

Mobile:

Bottom navigation.

Pages:

- Dashboard
- Fill-ups
- Statistics
- Vehicles

The currently selected vehicle should appear in the top navigation.

Display:

- thumbnail
- vehicle name

Clicking it opens a dropdown for switching vehicles.

Remember the last selected vehicle in localStorage.

---

# Charts

Use Recharts.

Use ResponsiveContainer.

Smooth animations.

Beautiful tooltips.

Modern styling.

Charts should be lazy-loaded.

---

# UI

Design language:

Apple inspired.

Minimal.

Elegant.

Large whitespace.

Rounded corners.

Subtle shadows.

Muted colors.

Beautiful typography.

Excellent spacing.

Light mode first.

Dark mode supported.

Responsive.

Primary usage is mobile browser.

Desktop should also feel polished.

Use shadcn/ui components throughout.

Components:

- Card
- Table
- Dialog
- AlertDialog
- DropdownMenu
- Button
- Calendar
- Popover
- Input
- Checkbox
- Badge
- Toast
- Skeleton
- Tabs
- Separator
- Tooltip
- ToggleGroup

Avoid unnecessary visual noise.

---

# Architecture

Use feature-based architecture.

```
src/

app/

components/

features/
    dashboard/
    fillups/
    statistics/
    vehicles/

actions/

db/

lib/

auth/

hooks/

schemas/

types/

utils/

services/
```

Each feature owns:

- components
- hooks
- actions
- schemas
- types

Prefer composition.

Keep files small.

Avoid duplicated logic.

---

# Code Quality

Strict TypeScript.

No any.

Reusable components.

Server Components whenever possible.

Client Components only when necessary.

Use Server Actions.

ESLint clean.

Strong typing everywhere.

---

# Performance

Optimize D1 queries.

Avoid unnecessary rerenders.

Lazy-load charts.

Minimize client-side JavaScript.

---

# Cloudflare

Provide:

- wrangler.jsonc
- D1 binding
- Environment variable configuration
- Migration scripts
- Seed script
- Local development instructions
- Deployment instructions

The project should deploy directly to Cloudflare Pages.

---

# Nice UX Details

Include:

- Loading skeletons
- Empty states
- Error boundaries
- Smooth page transitions
- Responsive tables
- Nice hover effects
- Keyboard shortcuts where appropriate
- Toast notifications
- Optimistic updates when possible

---

# Code Generation

Generate the complete project.

Do not simplify.

Create every page.

Create every component.

Create every schema.

Create every migration.

Create every action.

Create reusable services.

Generate production-quality code.

Maintain a consistent architecture.

The final result should be ready to:

- install dependencies
- run migrations
- seed the database
- start locally
- deploy directly to Cloudflare Pages

without requiring significant manual changes.

Commit as you go using conventional commits
