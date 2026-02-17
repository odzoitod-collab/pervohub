-- ============================================
-- SchoolHub UA - Supabase Schema
-- Виконайте цей SQL у Supabase SQL Editor
-- ============================================
--
-- РЕЄСТРАЦІЯ БЕЗ ПІДТВЕРДЖЕННЯ EMAIL:
-- Supabase Dashboard → Authentication → Providers → Email
-- вимкни "Confirm email" — тоді користувачі увійдуть одразу після реєстрації
--

-- 1. Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES - розширює auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'Учень' CHECK (role IN ('Учень', 'Вчитель', 'Директор', 'Адмін', 'Адміністратор', 'Батько')),
  grade TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POSTS
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_announcement BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LIKES (для підрахунку лайків на постах)
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STARTUPS
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal INTEGER NOT NULL DEFAULT 0,
  current_support INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6b. СТАРТАПИ: голосування (один голос на користувача на стартап)
CREATE TABLE IF NOT EXISTS public.startup_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(startup_id, user_id)
);

-- 7. LOST_ITEMS (Бюро знахідок)
CREATE TABLE IF NOT EXISTS public.lost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('lost', 'found')),
  image TEXT,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TRUST_BOX (Скарбничка довіри)
CREATE TABLE IF NOT EXISTS public.trust_box (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BELL_SCHEDULE (Розклад дзвінків)
CREATE TABLE IF NOT EXISTS public.bell_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_number INTEGER NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  name TEXT
);

-- 10. EVENTS (Свята та події)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGER: створює профіль при реєстрації
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, grade)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Учень'),
    NEW.raw_user_meta_data->>'grade'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS (Row Level Security)
-- При використанні Service Role Key RLS обходить.
-- Але для безпеки краще включити політики:
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_box ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE public.bell_schedule ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.bell_schedule;
CREATE POLICY "Allow all for authenticated" ON public.bell_schedule FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DO $$ BEGIN
  ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.events;
CREATE POLICY "Allow all for authenticated" ON public.events FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DO $$ BEGIN
  ALTER TABLE public.startup_votes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Прості політики: дозволити все для авторизованих (коли використовується anon key)
-- З Service Role RLS ігнорується повністю

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.profiles;
CREATE POLICY "Allow all for authenticated" ON public.profiles FOR ALL 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.posts;
CREATE POLICY "Allow all for authenticated" ON public.posts FOR ALL 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.likes;
CREATE POLICY "Allow all for authenticated" ON public.likes FOR ALL 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.comments;
CREATE POLICY "Allow all for authenticated" ON public.comments FOR ALL 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.startups;
CREATE POLICY "Allow all for authenticated" ON public.startups FOR ALL 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.lost_items;
CREATE POLICY "Allow all for authenticated" ON public.lost_items FOR ALL 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.trust_box;
CREATE POLICY "Allow insert for authenticated" ON public.trust_box FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Дозволити адмінам читати повідомлення (для Service Role RLS обходиться)
CREATE OR REPLACE FUNCTION public.is_school_admin_trust()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Адміністрація закладу', 'Директор', 'Адмін', 'Адміністратор')
  );
$$ LANGUAGE sql SECURITY DEFINER;
DROP POLICY IF EXISTS "Allow admin select trust" ON public.trust_box;
CREATE POLICY "Allow admin select trust" ON public.trust_box FOR SELECT
  USING (public.is_school_admin_trust() OR auth.role() = 'service_role');

-- ============================================
-- STORAGE: buckets для зображень
-- post — фото постів та бюро знахідок (Public)
-- images — аватарки (шлях: avatars/{user_id}_{timestamp}.jpg)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('post', 'post', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Політики для bucket "post"
DROP POLICY IF EXISTS "Allow authenticated upload post" ON storage.objects;
CREATE POLICY "Allow authenticated upload post" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post' AND auth.role() IN ('authenticated', 'service_role'));
DROP POLICY IF EXISTS "Public read post" ON storage.objects;
CREATE POLICY "Public read post" ON storage.objects
FOR SELECT USING (bucket_id = 'post');

-- Політики для bucket "images"
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
CREATE POLICY "Allow authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() IN ('authenticated', 'service_role'));
DROP POLICY IF EXISTS "Public read for images" ON storage.objects;
CREATE POLICY "Public read for images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- ============================================
-- МІГРАЦІЯ: оновити ролі (якщо таблиця вже існує)
-- ============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Учень', 'Вчитель', 'Директор', 'Адмін', 'Адміністратор', 'Адміністрація закладу', 'Батько'));

-- Міграція: додати status до startups (якщо таблиця вже існує)
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.startups DROP CONSTRAINT IF EXISTS startups_status_check;
ALTER TABLE public.startups ADD CONSTRAINT startups_status_check CHECK (status IN ('pending', 'accepted', 'rejected'));

-- RLS для startup_votes
ALTER TABLE public.startup_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.startup_votes;
CREATE POLICY "Allow all for authenticated" ON public.startup_votes FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================
-- ІНДЕКСИ для продуктивності
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_startups_author ON public.startups(author_id);
CREATE INDEX IF NOT EXISTS idx_lost_items_author ON public.lost_items(author_id);
CREATE INDEX IF NOT EXISTS idx_startup_votes_startup ON public.startup_votes(startup_id);

-- ============================================
-- REALTIME: підписка на зміни в реальному часі
-- Ігнорує помилку "already member" якщо таблиця вже додана
-- Dashboard → Database → Realtime показує увімкнені таблиці
-- ============================================
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['posts', 'likes', 'comments', 'startups', 'startup_votes', 'lost_items', 'bell_schedule', 'events'];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;  -- 42710: вже в publication
      WHEN OTHERS THEN
        IF SQLERRM LIKE '%already member%' THEN
          NULL;  -- ігноруємо "already member of publication"
        ELSE
          RAISE;
        END IF;
    END;
  END LOOP;
END $$;
