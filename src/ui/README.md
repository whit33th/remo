# UI Components - Social Icons

## SocialIcons

Централизованные SVG иконки социальных сетей, основанные на официальных логотипах.

### Использование

#### Основной компонент SocialIcon

```tsx
import { SocialIcon } from "../ui/SocialIcons";

// Базовое использование
<SocialIcon platform="instagram" />

// С кастомными размерами и классами
<SocialIcon
  platform="X"
  size={32}
  className="text-blue-500"
/>
```

#### Отдельные иконки

```tsx
import {
  InstagramIcon,
  XIcon,
  YouTubeIcon,
  TelegramIcon
} from "../ui/SocialIcons";

<InstagramIcon size={24} className="text-purple-500" />
<XIcon size={20} />
<YouTubeIcon size={28} />
<TelegramIcon size={16} />
```

#### Объект для обратной совместимости

```tsx
import { SOCIAL_ICONS } from "../ui/SocialIcons";

const IconComponent = SOCIAL_ICONS.instagram;
<IconComponent size={24} />;
```

### Поддерживаемые платформы

- `instagram` - Instagram
- `X` - X (Twitter)
- `youtube` - YouTube
- `telegram` - Telegram

### Пропсы

- `platform` (только для SocialIcon) - платформа социальной сети
- `size` - размер иконки в пикселях (по умолчанию: 24)
- `className` - дополнительные CSS классы

### Миграция

Старые эмодзи иконки из `PLATFORM_ICONS` заменены на SVG иконки:

```tsx
// Старый способ
import { PLATFORM_ICONS } from "../constants";
<span>{PLATFORM_ICONS.instagram}</span>;

// Новый способ
import { SocialIcon } from "../ui/SocialIcons";
<SocialIcon platform="instagram" />;
```

### Преимущества

- ✅ Высокое качество SVG иконок
- ✅ Масштабируемость без потери качества
- ✅ Кастомизация через CSS (цвет, размер)
- ✅ Единый источник истины для всех иконок
- ✅ Обратная совместимость
