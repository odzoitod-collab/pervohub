-- ============================================
-- PervozHub: Фічі 1, 2, 3
-- Portfolio, Mood Tracker, Startup Team
-- ============================================

-- 1. PORTFOLIO_ITEMS (цифрове портфоліо учня)
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('post', 'startup', 'certificate')),
  reference_id UUID,
  title TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all portfolio" ON public.portfolio_items;
CREATE POLICY "Users can view all portfolio" ON public.portfolio_items FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users manage own portfolio" ON public.portfolio_items;
CREATE POLICY "Users manage own portfolio" ON public.portfolio_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_user ON public.portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_created ON public.portfolio_items(created_at DESC);

-- 2. MOOD_LOGS (трекер емоційного стану)
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own mood logs" ON public.mood_logs;
CREATE POLICY "Users manage own mood logs" ON public.mood_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON public.mood_logs(user_id, created_at DESC);

-- Функція: 3 дні поспіль негативний настрій → trust_box
CREATE OR REPLACE FUNCTION public.check_mood_trust_alert()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  r RECORD;
  arr_d DATE[] := '{}';
  arr_m TEXT[] := '{}';
  i INT;
BEGIN
  SELECT name INTO user_name FROM public.profiles WHERE id = NEW.user_id;

  FOR r IN
    SELECT DISTINCT ON (created_at::date) mood, created_at::date as d
    FROM public.mood_logs
    WHERE user_id = NEW.user_id
    ORDER BY created_at::date DESC, created_at DESC
    LIMIT 3
  LOOP
    arr_d := arr_d || r.d;
    arr_m := arr_m || r.mood;
  END LOOP;

  IF array_length(arr_d, 1) < 3 THEN RETURN NEW; END IF;
  IF arr_d[1] - arr_d[2] <> 1 OR arr_d[2] - arr_d[3] <> 1 THEN RETURN NEW; END IF;
  FOR i IN 1..3 LOOP
    IF arr_m[i] NOT IN ('sad','angry','😔','😡') THEN RETURN NEW; END IF;
  END LOOP;

  INSERT INTO public.trust_box (message)
  VALUES ('Автоматичне сповіщення: Учень ' || COALESCE(user_name, 'Невизначений') || ' має пригнічений настрій кілька днів поспіль.');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_mood_log_insert ON public.mood_logs;
CREATE TRIGGER on_mood_log_insert
  AFTER INSERT ON public.mood_logs
  FOR EACH ROW EXECUTE FUNCTION public.check_mood_trust_alert();

-- 3. STARTUP_TEAM_REQUESTS (командоутворення)
CREATE TABLE IF NOT EXISTS public.startup_team_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(startup_id, user_id)
);

ALTER TABLE public.startup_team_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view team requests" ON public.startup_team_requests;
CREATE POLICY "Users can view team requests" ON public.startup_team_requests FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can create team request" ON public.startup_team_requests;
CREATE POLICY "Users can create team request" ON public.startup_team_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Startup author can update requests" ON public.startup_team_requests;
CREATE POLICY "Startup author can update requests" ON public.startup_team_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.startups s
      WHERE s.id = startup_id AND s.author_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_startup_team_requests_startup ON public.startup_team_requests(startup_id);

-- 4. STORAGE: bucket portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow authenticated upload portfolio" ON storage.objects;
DO $$ BEGIN
  CREATE POLICY "Allow authenticated upload portfolio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.role() IN ('authenticated', 'service_role'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DROP POLICY IF EXISTS "Public read portfolio" ON storage.objects;
DO $$ BEGIN
  CREATE POLICY "Public read portfolio" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Realtime
DO $$
DECLARE tbl text;
  tables text[] := ARRAY['portfolio_items', 'mood_logs', 'startup_team_requests'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
      WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%already member%' THEN RAISE; END IF;
    END;
  END LOOP;
END $$;
