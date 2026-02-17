# OneSignal PWA Push + Supabase

## Що зроблено

1. **Міграція** `supabase/migrations/006_onesignal_id.sql` — додано стовпець `onesignal_id` у таблицю `profiles`.
2. **Frontend** — у `index.html` підключено OneSignal SDK v16 і init з вашим `appId` та `safari_web_id`. Після підписки користувача Player ID зберігається в Supabase через `api.saveOnesignalId(userId, id)` (викликається з App при наявності поточного користувача).
3. **Service Worker** — у `public/OneSignalSDKWorker.js` один рядок: `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");`. Файл потрібно мати в **корені сайту** (у збірці Vite він копіюється з `public/` у корінь).
4. **Edge Function** `supabase/functions/send-push/index.ts` — приймає `user_id`, опційно `title`, `body`, `url`; бере з БД `onesignal_id` для цього користувача і відправляє пуш через OneSignal API.

## Конфлікт Service Worker (PWA + OneSignal)

На сайті вже є **Vite PWA** (файл `sw.js` від Workbox). Одночасно може бути активний лише **один** Service Worker для scope `"/"`. Якщо зареєстрований і `sw.js`, і `OneSignalSDKWorker.js`, браузер використовує той, що зареєстровано останнім.

- **Поточна схема:** OneSignal в init вказано `serviceWorkerPath: "OneSignalSDKWorker.js"`, тобто пуши обслуговує OneSignal Worker. Якщо перед цим встиг зареєструватись Workbox `sw.js`, можливий конфлікт; на частині пристроїв може переважати один з них.
- **Як об’єднати в один Worker:** можна перейти на стратегію `injectManifest` у Vite PWA і зібрати один `sw.js`, на початку якого викликати `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");`, далі — код Workbox (precache тощо). Тоді в init OneSignal вказувати `serviceWorkerPath: "/sw.js"` (або не вказувати path, якщо OneSignal підхопить той самий файл).

## Налаштування Edge Function

1. У **OneSignal Dashboard** → ваш додаток → **Settings → Keys & IDs** скопіюйте **REST API Key**.
2. У **Supabase** → ваш проєкт → **Project Settings → Edge Functions** → **Secrets** додайте:
   - `ONE_SIGNAL_REST_API_KEY` = ваш REST API Key з OneSignal.
3. Деплой функції:
   ```bash
   supabase functions deploy send-push
   ```
4. Виклик (з іншого backend або з Supabase через `pg_net`, cron тощо):
   ```bash
   curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/send-push" \
     -H "Authorization: Bearer <ANON_OR_SERVICE_ROLE_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"<UUID>","title":"Заголовок","body":"Текст пуша","url":"https://..."}'
   ```

## Міграція в БД

Виконайте в **Supabase SQL Editor** вміст файлу `supabase/migrations/006_onesignal_id.sql` (або застосуйте міграції проєктом Supabase CLI).
