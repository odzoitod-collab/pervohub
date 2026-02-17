-- Realtime: додати таблиці profiles та user_badges до публікації
-- щоб зміни профілів і нові відзнаки оновлювались у реальному часі
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['profiles', 'user_badges'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%already member%' THEN RAISE; END IF;
    END;
  END LOOP;
END $$;
