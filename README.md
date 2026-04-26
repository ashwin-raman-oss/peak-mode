# Peak Mode

**A personal operating system for people managing more goals than a to-do list can hold.**

---

## The Problem

Most people chasing big goals — job search, fitness, learning, side projects — are running four separate systems: a job tracker here, a habit app there, a journal somewhere else, nothing connecting them. The result is a week where you crushed your LinkedIn outreach but forgot to work out, or a month where you ran every day but let your career work slip to zero.

The problem isn't motivation. It's the absence of a unified system that makes all your goals visible simultaneously, creates accountability across all of them, and makes showing up feel worth it.

---

## The Product

Peak Mode is a personal performance dashboard built around the idea that your life has distinct domains — and you need to make progress in all of them, not just the one you're most anxious about this week.

It organizes your goals into four pillars:

- **Daily Big 3** — The three things that must happen today, no matter what. Set them each morning, check them off as you go. Your streak tracks consecutive days of follow-through.
- **Life Arenas** — Career, Health, Learning, and Misc. Every task lives in an arena. Every arena has weekly progress, XP, and an AI coach analysis.
- **66-Day Habit Tracker** — Science-backed habit formation. Each habit has its own streak, a visual progress grid, and retroactive logging for the past 7 days.
- **AI-Powered Weekly Reports** — Every Sunday, Claude analyzes your week: what you completed, what you skipped, patterns across arenas, and three specific commitments for the week ahead.

This isn't a to-do app with extra features. It's a system built around the belief that accountability, visibility, and momentum compound.

---

## Key Features

- **Daily Big 3 with streak tracking** — Set up to 3 must-do priorities each day. Streak increments when you complete them all; resets the next morning if you don't. Optimistic UI — checkboxes respond instantly before Supabase confirms.

- **4 Life Arenas with full task management** — Daily recurring, weekly count-based (e.g. "gym 3×/week"), and one-time tasks. Per-arena XP, completion rates, and weekly stats. Retroactive editing for any day in the current week.

- **66-Day Habit Formation** — Based on the actual research on habit formation timelines. Each habit tracks days completed vs. its effective target (adjusted for non-daily targets like weekdays-only). Per-habit streak, best streak, and a scrollable 66-square grid.

- **Morning/Evening Journal** — Daily check-in system. Morning sets intention; evening captures reflection and gratitude. Stored per-day, browsable by date.

- **OKR Tracking** — Objectives and Key Results with progress visualization. Archive completed OKRs. Track what you're aiming at, not just what you're doing today.

- **Monthly Calendar** — Color-coded completion view across the entire month. Green (all done), amber (partial), grey (missed). Stats bar and week-by-week breakdown table for spotting multi-week trends.

- **AI Coach Weekly Reports** — Claude Sonnet generates a full performance review with arena breakdown, honest pattern recognition, and a 3-step action plan per arena ("Dig deeper" analysis). Reports auto-generate Sunday at 23:59 UTC via Vercel Cron. All reports stored permanently and browsable by week.

- **XP + Leveling System** — High = 100 XP, Medium = 60 XP, Optional = 30 XP. XP accumulates toward levels (Rookie → Contender → Performer → Elite → Peak Mode). Weekly XP is the hero number on the dashboard.

- **Task completion hype messages** — Every task completion triggers a Claude Haiku call that returns one sentence of real encouragement tailored to the specific task. Delivered as an animated XP toast.

- **PWA — installable on any device** — Full offline shell caching via Workbox. Installs from the browser on iOS, Android, and desktop. No app store required.

---

## Product Thinking

**Why Daily Big 3 instead of a generic task list?**
A long to-do list is a way of avoiding the hard question: *what actually matters today?* The Big 3 forces that decision every morning. Three items is a constraint, not a limitation — it's what makes the streak meaningful.

**Why 66 days for habit tracking?**
The "21 days to build a habit" figure is a myth. The actual research (Lally et al., 2010) found it takes 18 to 254 days, with an average around 66 days. Building the tracker around 66 days gives users a realistic goal instead of a false promise.

**Why AI coaching instead of just statistics?**
Stats tell you what happened. A coach tells you what it means and what to do about it. The difference between "Career: 4/7 tasks (57%)" and "You front-loaded outreach Monday through Wednesday, then stalled. The pattern suggests you're burning decision energy early and deferring execution to later in the week" is the difference between a dashboard and an accountability partner.

**Why PWA instead of a native app?**
Ship speed and cross-platform reach. A PWA built on React gets to production weeks faster than native, works on every device from day one, and can be iterated on without app store review cycles. For a personal productivity tool, the install-from-browser flow is good enough — and the offline shell makes it feel genuinely native once installed.

---

## Technical Architecture

**Stack at a glance:**

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 6 + Tailwind CSS 3 |
| Routing | React Router 7 |
| Icons | Heroicons 2 |
| Database + Auth | Supabase (PostgreSQL + RLS + JWT) |
| AI | Anthropic Claude API (Haiku + Sonnet) |
| Hosting | Vercel (SPA + Serverless Functions) |
| PWA | vite-plugin-pwa (Workbox generateSW) |

**Architecture:**

```
Browser / Installed PWA
        │
        ▼
  React 19 SPA (Vercel CDN)
   ├── React Router 7 (client-side)
   ├── Tailwind CSS (design tokens)
   └── Supabase JS SDK
        │                     │
        ▼                     ▼
  Supabase                Vercel Serverless Functions
  ├── PostgreSQL           ├── POST /api/hype
  ├── Auth (email/pw)      ├── POST /api/weekly-report
  └── Row Level Security   ├── POST /api/arena-deep-dive
                           └── GET  /api/cron-weekly-report
                                        │
                                        ▼
                               Anthropic Claude API
                               ├── claude-haiku-4-5 (hype)
                               └── claude-sonnet-4-6 (reports)
```

**Key design decisions:**

- **Optimistic UI throughout.** Task completions, habit logs, and Big 3 check-offs apply to React state immediately, then persist to Supabase. Errors roll back. The app feels instant on any connection.

- **Row Level Security at the database layer.** Every Supabase table has `user_id` policies enforced in PostgreSQL — not in application code. Even a misconfigured query cannot reach another user's data. The Supabase anon key is safe to ship in the client bundle because RLS makes it powerless without a valid JWT.

- **`priority_override` pattern.** Tasks have both a base `priority` and a nullable `priority_override`. Effective priority is `COALESCE(priority_override, priority)`. Users can customize without losing the system's original signal; resetting to default is trivial.

- **Retroactive completions at noon UTC, zero XP.** Past-day edits are inserted with `completed_at = dateStr + 'T12:00:00Z'` and `xp_earned = 0`. The noon timestamp sidesteps DST edge cases; zero XP preserves fairness (no grinding historical data for levels).

- **New-user Postgres trigger.** `handle_new_user` fires on every `auth.users` insert, seeds the user's `profiles` row and a default set of recurring tasks. No onboarding wizard — the app is ready to use immediately after sign-up.

---

## AI Integration

Three distinct Claude use cases, each with different latency and cost tradeoffs:

**Task completion hype — `claude-haiku-4-5`**
Fires on every task completion. Fast and cheap. Returns one sentence of honest, context-aware encouragement ("That's 3 outreach messages. Recruiters notice consistency" lands differently than "Great job!"). Async after optimistic UI update — users never wait for it.

**Weekly performance report — `claude-sonnet-4-6`**
Runs on demand (and auto-generates Sunday at 23:59 UTC via Vercel Cron). Gets full context: tasks completed, XP earned, arena breakdown, streak held. Returns a structured coach summary plus three specific commitments for the following week. Persisted to the database — reports are permanent and browsable.

**Arena deep-dive analysis — `claude-sonnet-4-6`**
On-demand, per-arena. Returns a trend direction (↑/↓/→), a 1–2 sentence pattern identification, and a 3-step action plan. Separate endpoint keeps it independent — you only pay the latency when you want it.

**Why the API key lives server-side:**
`ANTHROPIC_API_KEY` is an environment variable on Vercel serverless functions only. It never touches the client bundle — no `VITE_` prefix, no browser exposure. Each function validates the caller's Supabase JWT before forwarding to Claude. This is the minimum viable security model for any LLM-backed app.

---

## Local Setup

**Prerequisites:** Node.js 18+, a [Supabase](https://supabase.com) project (free tier works), an [Anthropic API key](https://console.anthropic.com)

**1. Clone and install**

```bash
git clone https://github.com/ashwin-raman-oss/peak-mode.git
cd peak-mode
npm install
```

**2. Set up the database**

Run the migration files in order in your Supabase SQL Editor:

```
supabase/migrations/001_schema.sql             # Tables and indexes
supabase/migrations/002_rls_triggers_seed.sql  # RLS policies, new-user trigger, arena seed data
docs/migrations/003_next_week_commitments.sql  # next_week_commitments column
```

**3. Configure environment variables**

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key   # server-side only — no VITE_ prefix
CRON_SECRET=your-cron-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**4. Run locally**

For full local development including AI features:

```bash
npm install -g vercel
vercel dev   # runs frontend + serverless functions together on localhost:3000
```

Plain `npm run dev` works for frontend-only development (AI features will 404 without the function runtime).

---

## Environment Variables

| Variable | Where Used | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase publishable key (safe in browser — RLS enforces access) |
| `ANTHROPIC_API_KEY` | Server only | Claude API key — never reaches the client bundle |
| `CRON_SECRET` | Server only | Authorization header for Sunday cron endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role for cron job iterating across users |

---

## What I Learned

- **Claude Code as an execution partner changes the build loop.** Not "AI writes code, human reviews" — more like pair programming with a senior engineer who never loses context. The limiting factor shifted from implementation speed to product clarity: the clearer the spec, the better the output.

- **The gap between "it works" and "it's a product" is enormous.** The first working version of any feature is maybe 40% of the work. Edge cases, mobile UX, error states, offline behavior, timezone handling — all the things that make something feel real take longer than the happy path.

- **AI APIs change the build-vs-buy calculus.** Features that would have required a specialized third-party service — personalized coaching, pattern recognition, contextual encouragement — are now a single API call with a well-crafted prompt. The barrier to adding intelligence to a product is now mostly about product thinking, not engineering.

- **PWA is a serious portfolio-level choice, not a compromise.** The offline banner, install prompt, service worker, and cached shell are real engineering decisions. For a productivity app used daily, the installed PWA experience is indistinguishable from native to most users — and you ship it in a fraction of the time.

---

## Live Demo

**[peak-mode.vercel.app](https://peak-mode.vercel.app)**

Sign up with any email — a default set of tasks is seeded automatically so you can see the system in action immediately.

---

*Built by [Ashwin Raman](https://github.com/ashwin-raman-oss). Designed and built end-to-end using Claude Code as a development partner — from schema design and product thinking through UI iteration and deployment. Open to conversations about product, AI tooling, or the decisions behind this.*
