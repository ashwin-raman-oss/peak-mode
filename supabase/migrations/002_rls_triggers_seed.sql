-- 002_rls_triggers_seed.sql
-- Peak Mode — RLS policies, new-user trigger, arena seed data
-- Run AFTER 001_schema.sql

-- =====================
-- SEED ARENAS
-- =====================
INSERT INTO public.arenas (name, emoji, slug, default_priority) VALUES
  ('Career',            '💼', 'career',   'high'),
  ('Health',            '💪', 'health',   'medium'),
  ('Learning/Projects', '📚', 'learning', 'medium'),
  ('Misc',              '🎲', 'misc',     'optional')
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.arenas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports   ENABLE ROW LEVEL SECURITY;

-- arenas: any authenticated user can read; no user writes (seed data only)
CREATE POLICY "arenas_select" ON public.arenas
  FOR SELECT USING (true);

-- profiles: own row only
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- tasks: own rows only
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- task_completions: own rows only
CREATE POLICY "completions_select" ON public.task_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "completions_insert" ON public.task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- weekly_reports: own rows only
CREATE POLICY "reports_select" ON public.weekly_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert" ON public.weekly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_update" ON public.weekly_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================
-- NEW USER TRIGGER
-- Seeds profile + all recurring tasks on sign-up
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_career   uuid;
  v_health   uuid;
  v_learning uuid;
BEGIN
  -- Create profile row
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);

  -- Get arena IDs
  SELECT id INTO v_career   FROM public.arenas WHERE slug = 'career';
  SELECT id INTO v_health   FROM public.arenas WHERE slug = 'health';
  SELECT id INTO v_learning FROM public.arenas WHERE slug = 'learning';

  -- Daily tasks (Mon-Fri), weekly_target = 1
  INSERT INTO public.tasks (user_id, arena_id, title, task_type, recurrence, priority, weekly_target)
  VALUES
    (NEW.id, v_career,   'Reach out to 3 hiring managers',         'recurring', 'daily', 'high',   1),
    (NEW.id, v_career,   'Comment on 1 LinkedIn post',             'recurring', 'daily', 'high',   1),
    (NEW.id, v_career,   'Apply to 3 jobs (last 24hrs)',           'recurring', 'daily', 'high',   1),
    (NEW.id, v_health,   'Morning meditation',                     'recurring', 'daily', 'medium', 1),
    (NEW.id, v_learning, '1 hour of Claude Code project building', 'recurring', 'daily', 'high',   1);

  -- Weekly tasks
  INSERT INTO public.tasks (user_id, arena_id, title, task_type, recurrence, priority, weekly_target)
  VALUES
    (NEW.id, v_career,   'List dream companies',         'recurring', 'weekly', 'high',   1),
    (NEW.id, v_career,   'Have 1 informal conversation', 'recurring', 'weekly', 'high',   1),
    (NEW.id, v_learning, 'Complete PM course material',  'recurring', 'weekly', 'medium', 1),
    (NEW.id, v_health,   'No added sugar',               'recurring', 'weekly', 'medium', 2),
    (NEW.id, v_health,   'Strength training',            'recurring', 'weekly', 'medium', 4),
    (NEW.id, v_health,   'Run',                          'recurring', 'weekly', 'medium', 2);

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
