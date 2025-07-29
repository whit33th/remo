# Tretch - Content Creator Platform

## Миграция на Next.js 15 (App Router) ✅

Приложение было успешно мигрировано с Vite на Next.js 15 с использованием нового App Router. Все функции сохранены, включая интеграцию с Convex для бэкенда и аутентификации.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.local` и добавьте ваши настройки Convex:

```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Authentication (если используется)
AUTH_DOMAIN=your-domain.com
RESEND_TOKEN=your-resend-token
```

### 3. Запуск в разработке

```bash
npm run dev
```

Это запустит одновременно:

- Next.js сервер на `http://localhost:3000`
- Convex backend в режиме разработки

## 📦 Что изменилось в миграции

### Архитектура

- **Vite** → **Next.js 15** с App Router
- **React 19** (без изменений)
- **Convex** интеграция сохранена
- Все компоненты адаптированы под Next.js

### Структура файлов

#### До (Vite)

```
src/
  main.tsx           # Точка входа Vite
  App.tsx           # Главный компонент
  index.css         # Стили
  components/       # Компоненты
```

#### После (Next.js)

```
src/
  app/
    layout.tsx      # Корневой layout
    page.tsx        # Главная страница
    ConvexClientProvider.tsx  # Провайдер Convex
  components/       # Компоненты (без изменений)
  globals.css       # Глобальные стили
```

### Ключевые изменения

1. **Новая структура Next.js App Router**
   - `src/app/layout.tsx` - корневой layout с провайдерами
   - `src/app/page.tsx` - главная страница
   - Автоматическая маршрутизация файловой системы

2. **Провайдеры**
   - `ConvexClientProvider` выделен в отдельный компонент
   - Использует `'use client'` директиву

3. **Компоненты**
   - Все компоненты получили директиву `'use client'`
   - Импорты обновлены под новую структуру

4. **Конфигурация**
   - `next.config.js` для настройки Next.js
   - Обновленный `tailwind.config.js`
   - Новый `tsconfig.json` для Next.js

## 🛠️ Технологический стек

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (без изменений)
- **Стилизация**: Tailwind CSS
- **Аутентификация**: @convex-dev/auth
- **Уведомления**: Sonner
- **Шрифты**: Inter (Google Fonts)

## 📋 Особенности

### Что работает точно так же

- ✅ Аутентификация через Convex Auth
- ✅ Создание и редактирование постов
- ✅ Управление медиафайлами
- ✅ Календарь и планирование
- ✅ Аналитика и уведомления
- ✅ Все платформы (Instagram, X, YouTube, Telegram)

### Улучшения от Next.js

- 🚀 **Лучшая производительность** - автоматическая оптимизация
- 📱 **SSR поддержка** - серверный рендеринг
- 🔍 **SEO-дружелюбность** - мета-теги и структурированные данные
- 📦 **Встроенная оптимизация** - изображения, шрифты, CSS
- 🛣️ **App Router** - современная маршрутизация
- ⚡ **Быстрая сборка** - Turbopack в dev режиме

## 🚀 Деплой

### Vercel (рекомендуется)

```bash
# Установите Vercel CLI
npm i -g vercel

# Задеплойте проект
vercel
```

### Другие платформы

Проект совместим с любой платформой, поддерживающей Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📝 Команды

```bash
# Разработка (frontend + backend)
npm run dev

# Только frontend
npm run dev:frontend

# Только backend (Convex)
npm run dev:backend

# Сборка для продакшена
npm run build

# Запуск продакшен сервера
npm start

# Линтинг
npm run lint

# Проверка типов
npm run type-check
```

## 🔧 Настройка разработки

### VS Code расширения (рекомендуется)

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter

### Структура проекта

```
tretch/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Корневой layout
│   │   ├── page.tsx          # Главная страница
│   │   └── ConvexClientProvider.tsx
│   ├── components/            # React компоненты
│   │   ├── MainFeed.tsx
│   │   ├── PostEditor.tsx
│   │   ├── Calendar.tsx
│   │   └── ...
│   └── globals.css           # Глобальные стили
├── convex/                   # Convex backend (без изменений)
│   ├── schema.ts
│   ├── posts.ts
│   ├── auth.ts
│   └── ...
├── next.config.js           # Конфигурация Next.js
├── tailwind.config.js       # Конфигурация Tailwind
└── package.json            # Зависимости
```

## ❓ FAQ

### Почему Next.js вместо Vite?

- **Производительность**: Автоматические оптимизации из коробки
- **SEO**: Поддержка SSR/SSG для лучшего SEO
- **Экосистема**: Богатая экосистема и плагины
- **Deployment**: Простое развертывание на Vercel
- **Maintenance**: Меньше конфигурации, больше конвенций

### Будет ли все работать как раньше?

Да! Вся функциональность сохранена:

- Аутентификация работает идентично
- API Convex не изменилось
- UI компоненты остались теми же
- Все данные сохранены

### Нужно ли мигрировать базу данных?

Нет! Convex backend остался без изменений. Все данные, схемы и функции работают как раньше.

## 🤝 Поддержка

Если у вас возникли проблемы с миграцией:

1. Проверьте переменные окружения в `.env.local`
2. Убедитесь, что Convex deployment активен
3. Очистите кеш: `rm -rf .next node_modules && npm install`

---

**Happy coding! 🎉**
