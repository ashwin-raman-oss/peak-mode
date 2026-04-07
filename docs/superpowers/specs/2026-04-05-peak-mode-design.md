# Peak Mode — Design Spec
**Date:** 2026-04-05
**Status:** Approved

---

## Overview

Peak Mode is a gamified life performance tracker with an elite athlete aesthetic. Single-user, private PWA. Users track tasks across 4 life arenas, earn XP, level up, maintain streaks, and receive AI-generated hype and weekly reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS (Vite) |
| Backend / Auth / DB | Supabase (Postgres + Auth + RLS) |
| AI features | Claude API (Anthropic) via Vercel serverless functions |
| Deployment | Vercel (SPA + serverless functions from same repo) |
| PWA | `vite-plugin-pwa` (service worker + manifest) |

---

## Visual Design

- **Background:** `#0a0a0a`
- **Accent:** Electric Blue `#38bdf8`
- **Typography:** Sharp, high-contrast. Uppercase labels with letter-spacing for section headers.
- **Style:** Nike meets Whoop — dark, sleek, no clutter. Smooth animations on XP gains and task completion.
- **Priority colors:** High `#ef4444` (red), Medium `#eab308` (yellow), Optional `#22c55e` (green)

---

## Database Schema

### `profiles`
Seeded by trigger on `auth.users` insert.
```
id              uuid PK
user_id         uuid FK → auth.users (unique)
level           integer DEFAULT 1
total_xp        integer DEFAULT 0
current_streak  integer DEFAULT 0
longest_streak  integer DEFAULT 0
last_active_date date
created_at      timestamptz
```

### `arenas`
Static seed data — not user-editable.
```
id               uuid PK
name             text        -- "Career", "Health", "Learning/Projects", "Misc"
emoji            text        -- "💼", "💪", "📚", "🎲"
slug             text        -- "career", "health", "learning", "misc"
default_priority text        -- "high", "medium", "optional"
```

### `tasks`
Both recurring (seeded at account creation) and misc (user-created).
```
id                uuid PK
user_id           uuid FK → auth.users
arena_id          uuid FK → arenas
title             text
task_type         text    -- "recurring" | "misc"
recurrence        text    -- "daily" | "weekly" | "none"
priority          text    -- "high" | "medium" | "optional"
priority_override text    -- nullable; overrides priority when set
weekly_target     integer DEFAULT 1
is_active         boolean DEFAULT true
created_at        timestamptz
```

### `task_completions`
One row per completion event. Count rows to determine progress.
```
id              uuid PK
user_id         uuid FK → auth.users
task_id         uuid FK → tasks
completed_at    timestamptz
xp_earned       integer
week_start_date date        -- Monday of the week (for report aggregation)
```

### `weekly_reports`
One row per week, generated on demand (Monday trigger or manual).
```
id                uuid PK
user_id           uuid FK → auth.users
week_start_date   date (unique per user)
tasks_completed   integer
tasks_total       integer
xp_earned         integer
streak_held       boolean
arena_breakdown   jsonb   -- {career: {completed, total, xp}, health: {...}, ...}
ai_summary        text
created_at        timestamptz
```

### Row Level Security
All tables have RLS enabled.
- `arenas`: public read (`FOR SELECT USING (true)`), no user writes — it's shared seed data with no `user_id` column
- All other tables: `user_id = auth.uid()` (read + write own rows only)

---

## Seeded Data

### Arenas (static, shared)
| Name | Emoji | Slug | Default Priority |
|---|---|---|---|
| Career | 💼 | career | high |
| Health | 💪 | health | medium |
| Learning/Projects | 📚 | learning | medium |
| Misc | 🎲 | misc | optional |

### Recurring Tasks (seeded per user on account creation)

**Daily (Mon–Fri), `recurrence = 'daily'`, `weekly_target = 1`:**
| Title | Arena | Priority |
|---|---|---|
| Reach out to 3 hiring managers | Career | high |
| Comment on 1 LinkedIn post | Career | high |
| Apply to 3 jobs (last 24hrs) | Career | high |
| Morning meditation | Health | medium |
| 1 hour of Claude Code project building | Learning/Projects | high |

**Weekly, `recurrence = 'weekly'`:**
| Title | Arena | Priority | weekly_target |
|---|---|---|---|
| List dream companies | Career | high | 1 |
| Have 1 informal conversation | Career | high | 1 |
| Complete PM course material | Learning | medium | 1 |
| No added sugar | Health | medium | 2 |
| Strength training | Health | medium | 4 |
| Run | Health | medium | 2 |

---

## Application Structure

### Routes
```
/login              → Auth page (email + password)
/                   → Dashboard (protected)
/arena/:slug        → Arena detail page (protected)
/report             → Weekly report (protected)
/report/:weekDate   → Past weekly report (protected)
```

### Navigation
Top nav bar (persistent): Peak Mode logo | Dashboard | Report | (user avatar / logout)

---

## Auth

- Supabase email + password auth
- `AuthContext` React context wraps app via `supabase.auth.onAuthStateChange`
- `ProtectedRoute` component redirects unauthenticated users to `/login`
- On first login: Supabase DB trigger seeds `profiles` row + recurring `tasks` rows for the new user
- Session persisted automatically by Supabase JS client (localStorage)

---

## Dashboard (`/`)

Layout (top-down):
1. **Header bar** — App name | Level badge | XP progress bar | Streak badge
2. **Week date strip** — "Week of Apr 7 – Apr 11"
3. **Today's Focus** — Top 3 uncompleted High-priority tasks for today (clickable to complete inline)
4. **Arena cards grid (2×2)** — Each card shows arena name/emoji, progress bar (completions/total this week), XP earned this week. Tap → Arena detail page.
5. **Week XP summary** — Total XP earned this week

### Header detail
- Level: `Math.floor(total_xp / 1000) + 1`
- XP bar: `(total_xp % 1000) / 1000 * 100%` width
- Streak: days of consecutive weekdays where all High-priority tasks were completed

### Today's Focus logic
- If today is Saturday or Sunday: show message "Rest day. Back Monday."
- If Mon–Fri: surface top 3 uncompleted High-priority tasks for the current window — daily tasks not completed today + weekly High tasks not yet hit their `weekly_target` this week. Daily tasks sorted first (more time-sensitive), then weekly, then by creation time.
- Completing a task here triggers the same flow as completing from Arena detail page

### Form dip warning
If it's past 6pm on a weekday and any High-priority tasks are not completed: show a subtle amber banner "Form dip — X High tasks remaining today."

---

## Arena Detail Page (`/arena/:slug`)

- Arena header with emoji, name, progress bar
- **Recurring tasks section** — list of all active recurring tasks for this arena, with completion state for current window
- **Misc tasks section** — user-added tasks for this week, with "Add task" button
- Task row: checkbox | title | priority badge | (for count-based: `2 / 4` counter instead of checkbox)
- Checking off a task:
  1. Insert `task_completions` row
  2. Update `profiles.total_xp` and `profiles.last_active_date`
  3. Show XP animation (`+100 XP` floats up and fades)
  4. Call `/api/hype` → display 1-sentence hype message for 3 seconds
  5. Update local state optimistically

### Add Misc Task
Modal: title (text), arena (pre-selected to current), priority (dropdown, default = arena default). Creates a `tasks` row with `task_type = 'misc'`, `recurrence = 'none'`, `weekly_target = 1`.

---

## XP + Level System

| Priority | XP per completion |
|---|---|
| High | 100 |
| Medium | 60 |
| Optional | 30 |

- Level = `Math.floor(total_xp / 1000) + 1`
- Level-up animation triggers when `total_xp` crosses a 1000-multiple
- XP is written to `profiles.total_xp` on every completion

---

## Streak System

- Streak = consecutive weekdays (Mon–Fri) where all High-priority tasks were completed
- Evaluated on dashboard load by comparing `profiles.last_active_date` to yesterday
- Missing any High task on a weekday = streak resets to 0 the next day
- Weekend days are ignored (streak neither increments nor breaks on Sat/Sun)
- "Form dip" warning (not a break): amber banner if it's a weekday and High tasks remain past 6pm

---

## AI Features

### `/api/hype` (Vercel serverless function)
- **Model:** `claude-haiku-4-5-20251001` (fast, cheap)
- **Input:** `{ taskTitle, arenaName, userName }`
- **Output:** 1-sentence hype message in second person, energetic but not cringe
- **Auth:** Requires valid Supabase JWT in `Authorization` header
- **Prompt guidance:** Vary tone, reference the specific task, keep it under 12 words

### `/api/weekly-report` (Vercel serverless function)
- **Model:** `claude-sonnet-4-6` (thoughtful)
- **Input:** `{ weekStats: { tasksCompleted, tasksTotal, xpEarned, streakHeld, arenaBreakdown } }`
- **Output:** 3–4 sentence summary with honest insights and encouragement
- **Auth:** Requires valid Supabase JWT in `Authorization` header

---

## Weekly Report (`/report`)

- Triggered manually (button) or auto-generated on Monday for the previous week
- Displays: week date range, tasks completed/total, XP earned, streak status, arena-by-arena breakdown table, Claude-generated summary
- Saved to `weekly_reports` table (one row per week per user)
- `/report` shows current/most recent week
- `/report/:weekDate` shows any past week (browsable via prev/next navigation)

---

## PWA Configuration

- `vite-plugin-pwa` with Workbox
- **Manifest:** name "Peak Mode", short_name "Peak", theme_color `#0a0a0a`, background_color `#0a0a0a`, display `standalone`, icons at 192×192 and 512×512
- **Service worker strategy:** `NetworkFirst` for API calls, `CacheFirst` for static assets
- **Offline shell:** App loads and shows cached UI offline; data fetches fail gracefully with a "You're offline" indicator

---

## Environment Variables

```env
# .env.example
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

`ANTHROPIC_API_KEY` is only used server-side in Vercel functions — never exposed to the browser. `VITE_` prefixed vars are safe to expose (Supabase anon key is designed for public use with RLS).

---

## Project Structure

```
peak-mode/
├── api/
│   ├── hype.js              # Vercel serverless: Claude hype message
│   └── weekly-report.js     # Vercel serverless: Claude weekly summary
├── public/
│   ├── manifest.json
│   └── icons/               # PWA icons
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable: Button, Badge, ProgressBar, Modal, XPToast
│   │   ├── ArenaCard.jsx
│   │   ├── TaskRow.jsx
│   │   ├── TodaysFocus.jsx
│   │   ├── Header.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ArenaDetail.jsx
│   │   └── WeeklyReport.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useTasks.js
│   │   ├── useProfile.js
│   │   └── useWeeklyReport.js
│   ├── lib/
│   │   ├── supabase.js      # Supabase client init
│   │   ├── xp.js            # XP/level math helpers
│   │   ├── streak.js        # Streak evaluation logic
│   │   └── dates.js         # Week window helpers (getWeekStart, isWeekday, etc.)
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/          # SQL migration files
│   └── seed.sql             # Arena seed data + recurring tasks seed function
├── .env.example
├── vercel.json
└── vite.config.js
```

---

## Build Stages

1. Project scaffold + Supabase schema + seed data
2. Auth (login page, AuthContext, ProtectedRoute, profile trigger)
3. Dashboard (header, today's focus, arena cards, week strip)
4. Arena detail page (task list, completion flow, XP animation, misc task modal)
5. AI features (Vercel serverless functions, hype message, level-up animation)
6. Weekly report (report page, generation, past weeks browsing)
7. PWA (manifest, service worker, offline shell)
