# AI docs index

Mileage Tracker is **fully implemented** (see `git log` — 24 feature commits). This index exists so an agent picking up a new task loads only what's relevant, not everything.

Read this file first. Then load only the doc(s) below that match your task — don't load all of them by default.

| File                                      | Read when you're touching...                                          |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| [architecture.md](./architecture.md)     | any code — folder layout, tech stack, feature-module pattern         |
| [business-logic.md](./business-logic.md) | consumption/stats math, `src/services/*`                              |
| [database.md](./database.md)             | schema, migrations, seeding, `src/db/*`                                |
| [gotchas.md](./gotchas.md)               | any UI work with shadcn/Base UI components, Recharts, or ESLint config |
| [deployment.md](./deployment.md)         | wrangler.jsonc, Cloudflare deploy, D1 remote                           |

`README.md` at the repo root has the human-facing setup/deploy steps (install, seed, migrate, deploy commands) — read that instead of duplicating it here.

`original-spec.md` in this folder is the original product spec this project was built from, kept for historical reference only. It is **not** a live task list — everything in it is done.
