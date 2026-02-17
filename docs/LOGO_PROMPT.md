# Промпт для створення логотипу PervozHub

Використовуй цей текст у Midjourney, DALL·E, Ideogram або передай дизайнеру, щоб логотип і аватарки виглядали в єдиному стилі з сайтом.

---

## 1. Логотип додатку / сайту (іконка, favicon, PWA)

**Промпт (англійською для нейромереж):**

```
App icon logo for a school social network named "PervozHub". Style: minimal, modern, flat. 
Square format with rounded corners (about 24% radius). 
Background: smooth linear gradient from bright blue #0095f6 to dark blue #00376b. 
Central symbol: simple white silhouette — school building or graduation cap or abstract "P" letter integrated with a hub/network motif (dots or links). 
Clean vector look, no shadows, no 3D. Must read well at 32px and 128px. 
No text inside the icon. Professional, friendly, for students and teachers.
```

**Коротко українською для дизайнера:**

- Назва: **PervozHub** — соціальна мережа Первозванівського ліцею (учні, вчителі, батьки).
- Формат: квадрат з великим скругленням (як у поточному logo.svg).
- Фон: градієнт **#0095f6** → **#00376b** (як на сайті й екрані входу).
- Значок по центру: **білий, мінімальний** — школа (будівля/капелюх) або стилізована літера «P» + мотив мережі/хабу. Без тіні, без 3D.
- Має добре виглядати в малих розмірах (favicon 32px, іконка додатку 128–512px).

**Що вже є зараз:** у проєкті використовується `public/logo.svg` — градієнтний квадрат з білою іконкою школи (Lucide School). Новий логотип має зберегти ту саму палітру й «шкільний» дух, щоб виглядати як оновлення, а не чужорідний елемент.

---

## 2. Аватарки «як у нас на сайті»

У додатку аватарки користувачів виглядають так:

- **Якщо є фото:** кругле зображення, `object-cover`, тонка сіра рамка (`#efefef`).
- **Якщо фото немає (дефолт):** сервіс **DiceBear Initials** — на круглому фоні показуються **ініціали** (дві літери) у нейтральній кольоровій гамі; стиль — «initials», м’який, без різких градієнтів.

Щоб зробити **дефолтний аватар** у тому ж стилі (наприклад, для публікацій або бренду):

**Промпт для аватарки-плейсхолдера:**

```
Default avatar placeholder for a school app. Circle. 
Style: soft gradient or solid pastel background (light blue #e0f2fe or light gray #f0f0f0). 
Two initials in the center, sans-serif, bold, dark gray #374151. 
Minimal, friendly, no face, no illustration. 
Same mood as DiceBear Initials — clean and neutral.
```

**Технічно на сайті:** дефолтні аватарки беруться з  
`https://api.dicebear.com/7.x/initials/svg?seed=USER_ID_OR_EMAIL`  
— тобто стиль уже «ініціали на колі». Якщо робите власний набір плейсхолдерів, варто дотримуватись круглої форми, ініціалів і м’якої палітри (сині/сірі відтінки), щоб виглядало так само, як у додатку.

---

## 3. Єдиний стиль (логотип + аватарки)

- **Кольори сайту:** основний синій `#0095f6`, темно-синій `#00376b`, фон `#fafafa`, текст `#262626`, другорядний текст `#8e8e8e`.
- Логотип і іконка додатку — у цих же синіх тонах (градієнт + білий символ).
- Аватарки-плейсхолдери — круг, ініціали, спокійні кольори (світло-синій/сірий), без яскравих контрастів, щоб виглядати «як у нас на сайті».

Якщо потрібно, можна додати в цей файл посилання на згенеровані макети або фінальні SVG/PNG.
