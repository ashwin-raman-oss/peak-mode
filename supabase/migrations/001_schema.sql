-- 001_schema.sql
-- Peak Mode — table definitions
-- Run this first in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.arenas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  emoji            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  default_priority text NOT NULL CHECK (default_priority IN ('high','medium','optional'))
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  level            integer NOT NULL DEFAULT 1,
  total_xp         integer NOT NULL DEFAULT 0,
  current_streak   integer NOT NULL DEFAULT 0,
  longest_streak   integer NOT NULL DEFAULT 0,
  last_active_date date,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arena_id          uuid NOT NULL REFERENCES public.arenas(id),
  title             text NOT NULL,
  task_type         text NOT NULL CHECK (task_type IN ('recurring','misc')),
  recurrence        text NOT NULL CHECK (recurrence IN ('daily','weekly','none')),
  priority          text NOT NULL CHECK (priority IN ('high','medium','optional')),
  priority_override text CHECK (priority_override IN ('high','medium','optional')),
  weekly_target     integer NOT NULL DEFAULT 1,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_completions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id         uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at    timestamptz NOT NULL DEFAULT now(),
  xp_earned       integer NOT NULL,
  week_start_date date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date   date NOT NULL,
  tasks_completed   integer NOT NULL DEFAULT 0,
  tasks_total       integer NOT NULL DEFAULT 0,
  xp_earned         integer NOT NULL DEFAULT 0,
  streak_held       boolean NOT NULL DEFAULT false,
  arena_breakdown   jsonb NOT NULL DEFAULT '{}',
  ai_summary        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_user_id        ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_arena_id       ON public.tasks(arena_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_week ON public.task_completions(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_completions_task_id  ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_week    ON public.weekly_reports(user_id, week_start_date);
