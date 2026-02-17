-- Дірект (приватні повідомлення) між учасниками
-- Унікальна пара учасників: зберігаємо participant_1 < participant_2 за UUID для однієї кімнати на пару

CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT dm_conversations_order CHECK (participant_1 < participant_2),
  CONSTRAINT dm_conversations_unique_pair UNIQUE (participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON public.dm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created ON public.dm_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_updated ON public.dm_conversations(updated_at DESC);

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- Користувач бачить лише свої розмови
CREATE POLICY "dm_conversations_select_own"
  ON public.dm_conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Створювати розмову може авторизований; учасниками можуть бути тільки два різних (перевірка в app)
CREATE POLICY "dm_conversations_insert"
  ON public.dm_conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Користувач бачить повідомлення лише зі своїх розмов
CREATE POLICY "dm_messages_select_own"
  ON public.dm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Додавати повідомлення тільки в свої розмови і тільки від себе
CREATE POLICY "dm_messages_insert"
  ON public.dm_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Тригер: оновлювати updated_at при новому повідомленні
CREATE OR REPLACE FUNCTION public.dm_conversation_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dm_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS dm_messages_updated ON public.dm_messages;
CREATE TRIGGER dm_messages_updated
  AFTER INSERT ON public.dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.dm_conversation_updated();

-- Realtime для нових повідомлень (опційно)
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages';
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN IF SQLERRM NOT LIKE '%already member%' THEN RAISE; END IF;
END $$;
