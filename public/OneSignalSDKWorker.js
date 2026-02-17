/* OneSignal Service Worker — завантажує SDK для пуш-уведомлень.
   Увага: якщо на сайті вже є sw.js (наприклад від Vite PWA), лише один worker
   активний для scope "/". Якщо потрібні і кеш PWA, і пуши — об’єднайте обидва
   в один worker (injectManifest + importScripts OneSignal на початку). */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
