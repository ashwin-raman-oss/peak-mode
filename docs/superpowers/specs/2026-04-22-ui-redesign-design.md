# Peak Mode UI Redesign — Design Spec
**Date:** 2026-04-22  
**Status:** Approved

## Overview

Full visual redesign of Peak Mode from a top-nav SPA to a structured dashboard with a persistent dark sidebar. Plus addition of past-day journaling from two entry points. Implementation follows Approach 1: design tokens first, then layout shell, then page-by-page application.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Layout pattern | Persistent left sidebar | Most professional SaaS pattern; clear nav/content separation |
| Sidebar color | Dark (`#18181B`) | High contrast, signals serious tool, Stripe/Vercel aesthetic |
| Content background | Light gray (`#F8F9FA`) + white cards | Keeps content readable against dark sidebar |
| Primary accent | Amber (`#F59E0B`) | Reserved for XP/gamification — makes it feel intentional |
| Font | Plus Jakarta Sans | Polished, slightly warm, reads well at small sizes |
| Arena colors | Unchanged | Blue (Career), Green (Health), Orange (Learning), Gray (Misc) |

---

## Section 1 — Design Tokens

### `tailwind.config.js` changes

Replace the existing `peak-*` color palette with:

```js
peak: {
  sidebar:        '#18181B',   // dark sidebar background
  'sidebar-hover':'#27272A',   // nav item hover
  'sidebar-active':'#27272A',  // active nav item background
  'sidebar-text': '#71717A',   // inactive nav text
  'sidebar-border':'#27272A',  // sidebar internal borders
  bg:             '#F8F9FA',   // page/content area background
  surface:        '#FFFFFF',   // card surfaces
  border:         '#E4E4E7',   // card/section borders
  text:           '#09090B',   // primary near-black text
  muted:          '#71717A',   // secondary/meta text
  accent:         '#F59E0B',   // amber — XP, streak, primary CTA
  'accent-light': '#FEF3C7',   // amber tint for backgrounds
  success:        '#22C55E',   // green — health, completion
  'success-light':'#F0FDF4',
}
```

Remove: `peak-primary`, `peak-xp`, `peak-accent` (old blue), `peak-accent-light` (old blue tint), `peak-elevated`.

### `index.css` changes

Replace DM Sans with Plus Jakarta Sans:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}
```

---

## Section 2 — Layout Shell

### Retire `Header.jsx`

The current sticky top nav is removed entirely. All navigation moves to the sidebar.

### New `Sidebar.jsx`

Fixed-position, 220px wide, `peak-sidebar` background. Three regions:

**Top — Logo**
- Amber square logomark (`P`) + "Peak Mode" wordmark in white
- Bottom border separates from nav

**Middle — Navigation**
- Section label: "MAIN" (9px uppercase, muted)
- Nav links: Dashboard, Arena, Habits, Journal, Monthly, Weekly Report
- Each link: icon glyph + label, full-width, rounded-md
- Active state: `peak-sidebar-active` bg, white text, 600 weight
- Inactive state: `peak-sidebar-text`, hover brightens to white

**Bottom — User / XP**
- Avatar: circle with user's initial, `#3F3F46` bg
- Name + Level (e.g. "Ashwin · Level 12")
- Streak badge (amber pill, fire emoji + count) floated right
- XP progress bar: amber fill on dark track
- "X XP · Y to next level" label below

### Updated `App.jsx` layout

```jsx
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
    <TopBar />          {/* white bar: page title + date */}
    <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
      <Outlet />
    </main>
  </div>
</div>
```

**`TopBar.jsx`** (new, small component):
- White background, `peak-border` bottom border, 56px tall
- Left: page title (bold, `peak-text`) + subtitle (date/context, `peak-muted`)
- Right: context action button (e.g. "+ Add Task" on Dashboard, nothing on Report)

---

## Section 3 — Pages

### Dashboard (`/`)

**Layout:** Single scrollable column inside the content area.

**Stats row** — 4 cards in a grid, each with a colored left border (3px):
1. Streak — amber border, large number, "days" label
2. Today — green border, "x/y" fraction, "tasks done" label  
3. XP Today — amber border, "+340" in amber, "earned" label
4. Level — dark border, level number, "X% to next" label

**Two-column section below stats:**
- Left (flex-1): "Today's Focus" card — task rows with arena badge pills, completion checkboxes
- Right (340px): "Arena Progress" card — 4 labeled progress bars (Career/Health/Learning/Misc)

**Removed:** Activity feed. It clutters the dashboard without enough value.

### Arena Detail (`/arena/:slug`)

- Page title = arena name + task count badge
- Task list rendered as a clean card with table-like rows: checkbox · task name · priority badge · XP value
- Inline "Add task" row at the bottom of the list (no floating button)
- Empty state: centered message + add task prompt

### Habit Tracker (`/habits`)

- Stat card above the grid: current streak + longest streak (same card style as dashboard)
- 66-day grid: tighter cells, amber fill for completed, `#E4E4E7` for missed, `#F4F4F5` for future
- Day number label inside each cell, small

### Journal (`/journal`)

- **"Log past entry" button** in the TopBar right slot
  - Opens `PastEntryModal` (see Section 4)
- Timeline entries: white surface cards, `peak-border` border
- Entry type label: amber pill badge ("Morning" / "Evening")
- Backdated entries get a subtle "· backdated" suffix in `peak-muted` next to the date
- Mood/energy scores: small horizontal bar (colored fill, 1–10 scale) instead of raw numbers

### Monthly Tracker (`/month`)

- Calendar grid: white cells, `peak-border` grid lines
- Amber dot indicator on days with ≥1 completed task
- Day drill-down modal gets two tabs: **Tasks** (existing behavior) and **Journal**
  - Journal tab shows morning entry status + evening entry status
  - Each shows: exists → entry preview + Edit button; missing → "Add" button
  - Add/Edit opens inline within the modal (not a nested modal)

### Weekly Report (`/report`)

- Full-width layout — sidebar stays, but report content uses the full content area with no right-side widgets competing
- AI coach text: 15px base, `peak-text`, generous line-height (1.7)
- Secondary sections (stats, summaries) use `peak-muted` for labels
- Prev/Next week navigation: positioned in the TopBar subtitle area (e.g. "← Week 16 · Week 17 · Week 18 →")

---

## Section 4 — Past-Day Journaling Feature

### Entry points

**A. Journal page (`/journal`) — "Log past entry" button**

A button in the TopBar right slot opens `PastEntryModal`:
1. Date picker — max date is yesterday, min date is account creation date
2. Session toggle — Morning / Evening (if both already exist for selected date, show notice)
3. Standard journal form (same fields as today's form)
4. Submit → writes to Supabase `journal_entries` table with the selected date
5. Entry appears in the timeline in correct chronological position

**B. Monthly Tracker (`/month`) — Day drill-down Journal tab**

The existing `DayDetailModal` gains a "Journal" tab (alongside the existing Tasks tab):
- Shows two rows: Morning entry · Evening entry
- Each row: status icon (✓ exists / + missing) · entry type label · action button
- "Add" → expands an inline form within the modal (same fields as standard journal)
- "Edit" → expands the existing entry for editing
- Save → upserts the record in Supabase

### Data model

No schema changes needed. The existing `journal_entries` table already stores `entry_date`, `session` (morning/evening), and content fields. The only change is that the current UI enforces `entry_date = today` — that constraint is removed.

### Validation

- Cannot journal for future dates
- Cannot create a duplicate session for the same date (the UI prevents it; the DB has a unique constraint on `(user_id, entry_date, session)`)

---

## Files Affected

| File | Change |
|---|---|
| `tailwind.config.js` | New color tokens, remove old ones |
| `src/index.css` | Swap font to Plus Jakarta Sans |
| `src/components/Header.jsx` | Retire (delete) |
| `src/components/Sidebar.jsx` | New component |
| `src/components/TopBar.jsx` | New component |
| `src/App.jsx` | New layout wrapper |
| `src/pages/Dashboard.jsx` | Redesign |
| `src/pages/ArenaDetail.jsx` | Redesign |
| `src/pages/HabitTracker.jsx` | Redesign |
| `src/pages/Journal.jsx` | Redesign + Log past entry button |
| `src/pages/MonthlyTracker.jsx` | Redesign |
| `src/pages/WeeklyReport.jsx` | Redesign |
| `src/components/DayDetailModal.jsx` | Add Journal tab |
| `src/components/PastEntryModal.jsx` | New component |
| `src/components/ui/Button.jsx` | Re-skin to new tokens |
| `src/components/ui/Badge.jsx` | Re-skin to new tokens |
| `src/components/ui/Modal.jsx` | Re-skin to new tokens |
| `src/components/ui/ProgressBar.jsx` | Re-skin to new tokens |
