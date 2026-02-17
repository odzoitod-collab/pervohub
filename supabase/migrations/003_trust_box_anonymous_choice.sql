-- Скарбничка довіри: вибір «відправити анонімно» чи з іменем
-- Учень обирає; адмін бачить ім'я лише якщо учень вибрав «не анонімно»
ALTER TABLE public.trust_box
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trust_box_author ON public.trust_box(author_id);

-- RLS: при відправці дозволити лише author_id = auth.uid() (своє ім'я) або author_id IS NULL (анонімно)
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.trust_box;
CREATE POLICY "Allow insert for authenticated" ON public.trust_box FOR INSERT
  WITH CHECK (
    (auth.role() = 'authenticated' AND (author_id IS NULL OR author_id = auth.uid()))
    OR auth.role() = 'service_role'
  );

COMMENT ON COLUMN public.trust_box.is_anonymous IS 'true = учень обрав анонімно; false = адмін бачить автора';
COMMENT ON COLUMN public.trust_box.author_id IS 'Заповнюється лише коли is_anonymous = false';
