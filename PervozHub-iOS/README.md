# PervozHub — iOS-приложение (WebView)

Минимальное приложение на Swift/SwiftUI, которое показывает ваш лендинг `lendos.html` (или сайт по URL) в полноэкранном WebView.

## Что нужно

- macOS с установленным **Xcode** (из App Store).
- Файл `lendos.html` (можно скопировать из корня проекта schoolhub-ua).

## Как собрать в Xcode

### 1. Создать новый проект

1. Откройте **Xcode**.
2. **File → New → Project…**
3. Выберите **iOS → App**, нажмите **Next**.
4. Укажите:
   - **Product Name:** `PervozHub-iOS`
   - **Team:** ваш Apple ID (для установки на устройство).
   - **Organization Identifier:** например `ua.pervozhub`
   - **Interface:** SwiftUI  
   - **Language:** Swift  
   - **Storage:** None  
   - Снимите галочки с Tests при желании.
5. Нажмите **Next**, выберите папку (например, `PervozHub-iOS` рядом с этим README) и **Create**.

### 2. Подменить файлы приложения

Удалите в Xcode сгенерированные файлы контента приложения (например, только `ContentView.swift`, если там дефолтный «Hello World») и **добавьте** файлы из папки `PervozHub-iOS`:

- `PervozHub_iosApp.swift` — точка входа (можно заменить существующий `*_App.swift`).
- `ContentView.swift` — главный экран.
- `WebView.swift` — обёртка WKWebView.

Либо: в Finder скопируйте эти три файла из `PervozHub-iOS/PervozHub-iOS/` в папку вашего целевого приложения в созданном проекте и в Xcode добавьте их в таргет (правый клик по группе → **Add Files to "PervozHub-iOS"…**).

### 3. Добавить лендинг в приложение

1. В Xcode в навигаторе слева правый клик по группе с кодом приложения (например, `PervozHub-iOS`) → **Add Files to "PervozHub-iOS"…**.
2. Выберите файл **`lendos.html`** из корня репозитория `schoolhub-ua` (рядом с этим README — на уровень выше папки `PervozHub-iOS`).
3. Убедитесь, что отмечено **Copy items if needed** и что файл добавлен в таргет **PervozHub-iOS**.
4. Нажмите **Add**.

После этого приложение будет показывать локальный `lendos.html` без интернета (шрифты и иконки с CDN подгрузятся при наличии сети).

### 4. (По желанию) Показывать сайт по URL

Если лендинг уже размещён в интернете:

1. Откройте в проекте **`ContentView.swift`**.
2. Замените строку:
   ```swift
   private static let siteURL = "https://your-site.com"
   ```
   на реальный URL, например:
   ```swift
   private static let siteURL = "https://pervozhub.ua"
   ```
3. Если оставить `"https://your-site.com"` или пустую строку, будет использоваться локальный **lendos.html**.

### 5. Запуск

- Подключите iPhone или выберите симулятор.
- Нажмите **Run** (▶️) или **Cmd+R**.

Готово: приложение открывается с вашим лендингом в полноэкранном WebView.

## Публикация в App Store

Для публикации нужна платная учётная запись Apple Developer. В Xcode: **Product → Archive**, затем загрузка в App Store Connect и настройка метаданных и скриншотов в App Store Connect.

## Структура

```
PervozHub-iOS/
├── README.md
└── PervozHub-iOS/
    ├── PervozHub_iosApp.swift   # @main
    ├── ContentView.swift        # экран с WebView
    ├── WebView.swift            # WKWebView
    └── Info.plist               # при необходимости скопировать настройки в проект
```

Если при создании проекта Xcode не спросил про Info.plist, нужные ключи (например, `CFBundleDisplayName`, `NSAppTransportSecurity`) можно добавить вручную в **Target → Info** или в отдельный `Info.plist` в настройках таргета.
