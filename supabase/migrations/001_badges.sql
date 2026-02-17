-- =============================================
-- Gamification: Badges (Відзнаки) — PervozHub
-- =============================================

-- Enum для рідкості відзнаки
CREATE TYPE badge_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Таблиця відзнак (каталог)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,           -- URL на SVG або емодзі (наприклад "🏆" або "https://...")
  description TEXT,
  rarity badge_rarity NOT NULL DEFAULT 'common',
  color_from TEXT NOT NULL DEFAULT '#6366f1',  -- початок градієнта
  color_to TEXT NOT NULL DEFAULT '#8b5cf6',     -- кінець градієнта
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблиця виданих відзнак користувачам
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_created_at ON user_badges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- badges: всі можуть читати каталог
CREATE POLICY "badges_select_all" ON badges FOR SELECT USING (true);

-- user_badges: всі авторизовані можуть читати видані відзнаки (для профілів)
CREATE POLICY "user_badges_select_authenticated" ON user_badges FOR SELECT
  TO authenticated USING (true);

-- user_badges: тільки вчитель/адмін може вставляти (перевірка ролі в profiles)
CREATE POLICY "user_badges_insert_teacher_admin" ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('Вчитель', 'Адміністрація закладу', 'Директор', 'Адмін', 'Адміністратор')
    )
  );

-- Опційно: заборонити оновлення/видалення записів user_badges (історія не редагується)
-- CREATE POLICY "user_badges_no_update" ON user_badges FOR UPDATE USING (false);
-- CREATE POLICY "user_badges_no_delete" ON user_badges FOR DELETE USING (false);

-- Сидіть дані: приклади відзнак (пропустити, якщо вже є записи)
INSERT INTO badges (name, icon, description, rarity, color_from, color_to)
SELECT * FROM (VALUES
  ('Перший крок', '🌱', 'За перший опублікований пост', 'common'::badge_rarity, '#86efac', '#4ade80'),
  ('Допомога однокласнику', '🤝', 'За активність у коментарях та взаємодопомогу', 'common'::badge_rarity, '#93c5fd', '#60a5fa'),
  ('Ідея року', '💡', 'За переможний стартап-проєкт', 'rare'::badge_rarity, '#fcd34d', '#f59e0b'),
  ('Організатор', '📋', 'За організацію подій та ініціатив', 'rare'::badge_rarity, '#a78bfa', '#8b5cf6'),
  ('Лідер думок', '⭐', 'За високий вплив та повагу спільноти', 'epic'::badge_rarity, '#f472b6', '#ec4899'),
  ('Легенда школи', '👑', 'Виняткові досягнення та внесок у життя школи', 'legendary'::badge_rarity, '#fbbf24', '#f59e0b')
) AS v(name, icon, description, rarity, color_from, color_to)
WHERE NOT EXISTS (SELECT 1 FROM badges LIMIT 1);
