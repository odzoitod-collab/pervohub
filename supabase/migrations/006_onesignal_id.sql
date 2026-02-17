-- OneSignal Push: зберігаємо Player ID (subscription id) для відправки пушів конкретним користувачам
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onesignal_id TEXT;

COMMENT ON COLUMN public.profiles.onesignal_id IS 'OneSignal Player ID (Push Subscription ID) для веб-пушів';

-- Існуючі політики RLS на оновлення профілю (власний профіль) вже дозволяють оновлювати рядок;
-- якщо окремої політики на UPDATE немає — додайте: дозволити оновлення де id = auth.uid()
