# Деплой PervozHub на Render

## Швидкий старт

1. **Зареєструйтесь** на [render.com](https://render.com) і підключіть GitHub/GitLab.

2. **New → Static Site** (або New → Blueprint, якщо хочете використати `render.yaml`).

3. **Підключіть репозиторій** і оберіть гілку (наприклад, `main`).

4. **Build settings** (якщо налаштовуєте вручну, без Blueprint):
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

5. **Environment Variables** — обов’язково додайте:
   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | Ваш Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Ваш Supabase anon або service_role key |

   Опціонально:
   | Key | Value |
   |-----|-------|
   | `GEMINI_API_KEY` | Для AI-функцій |
   | `NODE_VERSION` | `20` (за замовчуванням Render використовує LTS) |

6. **Create Static Site** — Render запустить збірку і видасть URL типу `https://pervozhub.onrender.com`.

---

## Supabase: додати домен

1. У [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → Authentication → URL Configuration.
2. У **Site URL** вкажіть ваш Render URL (наприклад, `https://pervozhub.onrender.com`).
3. У **Redirect URLs** додайте:
   - `https://pervozhub.onrender.com/**`
   - `https://ваш-домен.com/**` (якщо є кастомний домен).

---

## Blueprint (IaC)

У репозиторії є `render.yaml` — Blueprint для Render. Його можна використати так:

1. New → Blueprint.
2. Підключіть репозиторій з `render.yaml`.
3. Render створить Static Site з налаштуваннями з файлу.
4. Змінні оточення потрібно вказати вручну (Dashboard → Service → Environment) або задати при першому sync.

---

## Кастомний домен

1. Render Dashboard → ваш сервіс → Settings → Custom Domains.
2. Додайте домен і оновіть DNS у вашого провайдера.
3. Після цього оновіть Supabase Site URL і Redirect URLs.
