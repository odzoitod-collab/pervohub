-- Подяки вчителю: тільки учні можуть надсилати, тільки вчителям (NFT-стиль у профілі)
CREATE TABLE IF NOT EXISTS public.teacher_thanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_thanks_to_user ON public.teacher_thanks(to_user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_thanks_created ON public.teacher_thanks(to_user_id, created_at DESC);

ALTER TABLE public.teacher_thanks ENABLE ROW LEVEL SECURITY;

-- Читати подяки вчителя можуть усі авторизовані (для відображення в профілі)
CREATE POLICY "teacher_thanks_select"
  ON public.teacher_thanks FOR SELECT TO authenticated USING (true);

-- Вставляти тільки авторизований учень (роль Учень), і тільки якщо to_user_id — вчитель/адмін
CREATE POLICY "teacher_thanks_insert_student_to_teacher"
  ON public.teacher_thanks FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p_from
      WHERE p_from.id = auth.uid() AND p_from.role = 'Учень'
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p_to
      WHERE p_to.id = to_user_id
      AND p_to.role IN ('Вчитель', 'Адміністрація закладу', 'Директор', 'Адмін', 'Адміністратор')
    )
  );

COMMENT ON TABLE public.teacher_thanks IS 'Подяки від учнів вчителям; тільки для вчителів';
