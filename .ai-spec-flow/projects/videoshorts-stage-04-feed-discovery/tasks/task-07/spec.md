# Task 07: Translations & i18n

## Overview

**Priority:** MEDIUM
**Dependencies:** None
**Complexity:** Medium (13 files, ~13k tokens)
**Status:** pending

## What to Build

Create translation files for all 6 supported languages:
1. feed.json - Feed-related translations
2. search.json - Search-related translations
3. Update i18n.ts configuration to include new namespaces

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/locales/pl/feed.json` | Create | Polish feed translations |
| `src/lib/locales/en/feed.json` | Create | English feed translations |
| `src/lib/locales/de/feed.json` | Create | German feed translations |
| `src/lib/locales/es/feed.json` | Create | Spanish feed translations |
| `src/lib/locales/ru/feed.json` | Create | Russian feed translations |
| `src/lib/locales/uk/feed.json` | Create | Ukrainian feed translations |
| `src/lib/locales/pl/search.json` | Create | Polish search translations |
| `src/lib/locales/en/search.json` | Create | English search translations |
| `src/lib/locales/de/search.json` | Create | German search translations |
| `src/lib/locales/es/search.json` | Create | Spanish search translations |
| `src/lib/locales/ru/search.json` | Create | Russian search translations |
| `src/lib/locales/uk/search.json` | Create | Ukrainian search translations |

## Files to Modify

| File | Changes |
|------|---------|
| `i18n.ts` | Add feed and search namespace imports |

## Implementation Details

### 1. Polish (pl) - feed.json

```json
{
  "sort": {
    "label": "Sortuj",
    "algorithmic": "Dla Ciebie",
    "newest": "Najnowsze",
    "popular": "Popularne",
    "trending": "Na czasie",
    "following": "Obserwowane"
  },
  "filters": {
    "title": "Filtry",
    "apply": "Zastosuj filtry",
    "clear": "Wyczysc wszystkie",
    "location": {
      "label": "Lokalizacja",
      "radius": "Promien",
      "detectLocation": "Wykryj lokalizacje",
      "detecting": "Wykrywanie...",
      "wholeCountry": "Caly kraj",
      "nearMe": "W poblizu ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Caly kraj"
      }
    },
    "categories": {
      "label": "Kategorie",
      "placeholder": "Wybierz kategorie...",
      "maxSelected": "Maksymalnie {max} kategorii"
    },
    "tags": {
      "label": "Tagi",
      "placeholder": "Szukaj tagow..."
    },
    "verifiedOnly": {
      "label": "Tylko zweryfikowane",
      "description": "Pokaz tylko shorty od zweryfikowanych firm"
    },
    "activeFilters": "Aktywne filtry: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Brak shortow w tym obszarze",
      "description": "Sprobuj rozszerzyc promien lub zmienic filtry",
      "expandRadius": "Rozszerz promien",
      "clearFilters": "Usun filtry",
      "browseAll": "Przegladaj wszystkie"
    },
    "noFollowing": {
      "title": "Nie obserwujesz jeszcze zadnych firm",
      "description": "Odkryj lokalne firmy i zacznij obserwowac",
      "discoverCta": "Odkryj firmy"
    }
  },
  "loading": {
    "more": "Ladowanie wiecej...",
    "skeleton": "To juz wszystko!"
  },
  "card": {
    "views": "{count} wyswietlen",
    "likes": "{count} polubien",
    "distance": "{distance} od Ciebie"
  }
}
```

### 2. English (en) - feed.json

```json
{
  "sort": {
    "label": "Sort",
    "algorithmic": "For You",
    "newest": "Newest",
    "popular": "Popular",
    "trending": "Trending",
    "following": "Following"
  },
  "filters": {
    "title": "Filters",
    "apply": "Apply filters",
    "clear": "Clear all",
    "location": {
      "label": "Location",
      "radius": "Radius",
      "detectLocation": "Detect location",
      "detecting": "Detecting...",
      "wholeCountry": "Whole country",
      "nearMe": "Near me ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Whole country"
      }
    },
    "categories": {
      "label": "Categories",
      "placeholder": "Select categories...",
      "maxSelected": "Maximum {max} categories"
    },
    "tags": {
      "label": "Tags",
      "placeholder": "Search tags..."
    },
    "verifiedOnly": {
      "label": "Verified only",
      "description": "Show only shorts from verified companies"
    },
    "activeFilters": "Active filters: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "No shorts in this area",
      "description": "Try expanding the radius or changing filters",
      "expandRadius": "Expand radius",
      "clearFilters": "Clear filters",
      "browseAll": "Browse all"
    },
    "noFollowing": {
      "title": "You don't follow any companies yet",
      "description": "Discover local businesses and start following",
      "discoverCta": "Discover companies"
    }
  },
  "loading": {
    "more": "Loading more...",
    "skeleton": "That's all!"
  },
  "card": {
    "views": "{count} views",
    "likes": "{count} likes",
    "distance": "{distance} away"
  }
}
```

### 3. German (de) - feed.json

```json
{
  "sort": {
    "label": "Sortieren",
    "algorithmic": "Fur dich",
    "newest": "Neueste",
    "popular": "Beliebt",
    "trending": "Im Trend",
    "following": "Gefolgt"
  },
  "filters": {
    "title": "Filter",
    "apply": "Filter anwenden",
    "clear": "Alle loschen",
    "location": {
      "label": "Standort",
      "radius": "Radius",
      "detectLocation": "Standort erkennen",
      "detecting": "Erkennung...",
      "wholeCountry": "Ganzes Land",
      "nearMe": "In der Nahe ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Ganzes Land"
      }
    },
    "categories": {
      "label": "Kategorien",
      "placeholder": "Kategorien auswahlen...",
      "maxSelected": "Maximal {max} Kategorien"
    },
    "tags": {
      "label": "Tags",
      "placeholder": "Tags suchen..."
    },
    "verifiedOnly": {
      "label": "Nur verifizierte",
      "description": "Nur Shorts von verifizierten Unternehmen anzeigen"
    },
    "activeFilters": "Aktive Filter: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Keine Shorts in diesem Bereich",
      "description": "Versuche den Radius zu erweitern oder Filter zu andern",
      "expandRadius": "Radius erweitern",
      "clearFilters": "Filter loschen",
      "browseAll": "Alle durchsuchen"
    },
    "noFollowing": {
      "title": "Du folgst noch keinen Unternehmen",
      "description": "Entdecke lokale Unternehmen und beginne zu folgen",
      "discoverCta": "Unternehmen entdecken"
    }
  },
  "loading": {
    "more": "Mehr laden...",
    "skeleton": "Das war alles!"
  },
  "card": {
    "views": "{count} Aufrufe",
    "likes": "{count} Likes",
    "distance": "{distance} entfernt"
  }
}
```

### 4. Spanish (es) - feed.json

```json
{
  "sort": {
    "label": "Ordenar",
    "algorithmic": "Para ti",
    "newest": "Mas recientes",
    "popular": "Populares",
    "trending": "Tendencias",
    "following": "Siguiendo"
  },
  "filters": {
    "title": "Filtros",
    "apply": "Aplicar filtros",
    "clear": "Borrar todos",
    "location": {
      "label": "Ubicacion",
      "radius": "Radio",
      "detectLocation": "Detectar ubicacion",
      "detecting": "Detectando...",
      "wholeCountry": "Todo el pais",
      "nearMe": "Cerca de mi ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Todo el pais"
      }
    },
    "categories": {
      "label": "Categorias",
      "placeholder": "Seleccionar categorias...",
      "maxSelected": "Maximo {max} categorias"
    },
    "tags": {
      "label": "Etiquetas",
      "placeholder": "Buscar etiquetas..."
    },
    "verifiedOnly": {
      "label": "Solo verificados",
      "description": "Mostrar solo shorts de empresas verificadas"
    },
    "activeFilters": "Filtros activos: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "No hay shorts en esta area",
      "description": "Intenta ampliar el radio o cambiar los filtros",
      "expandRadius": "Ampliar radio",
      "clearFilters": "Borrar filtros",
      "browseAll": "Explorar todos"
    },
    "noFollowing": {
      "title": "Aun no sigues a ninguna empresa",
      "description": "Descubre negocios locales y empieza a seguir",
      "discoverCta": "Descubrir empresas"
    }
  },
  "loading": {
    "more": "Cargando mas...",
    "skeleton": "Eso es todo!"
  },
  "card": {
    "views": "{count} vistas",
    "likes": "{count} me gusta",
    "distance": "a {distance}"
  }
}
```

### 5. Russian (ru) - feed.json

```json
{
  "sort": {
    "label": "Сортировка",
    "algorithmic": "Для вас",
    "newest": "Новые",
    "popular": "Популярные",
    "trending": "В тренде",
    "following": "Подписки"
  },
  "filters": {
    "title": "Фильтры",
    "apply": "Применить фильтры",
    "clear": "Очистить все",
    "location": {
      "label": "Местоположение",
      "radius": "Радиус",
      "detectLocation": "Определить местоположение",
      "detecting": "Определение...",
      "wholeCountry": "Вся страна",
      "nearMe": "Рядом ({distance})",
      "radiusOptions": {
        "1km": "1 км",
        "5km": "5 км",
        "10km": "10 км",
        "25km": "25 км",
        "50km": "50 км",
        "all": "Вся страна"
      }
    },
    "categories": {
      "label": "Категории",
      "placeholder": "Выберите категории...",
      "maxSelected": "Максимум {max} категорий"
    },
    "tags": {
      "label": "Теги",
      "placeholder": "Поиск тегов..."
    },
    "verifiedOnly": {
      "label": "Только проверенные",
      "description": "Показывать только shorts от проверенных компаний"
    },
    "activeFilters": "Активные фильтры: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Нет shorts в этом районе",
      "description": "Попробуйте расширить радиус или изменить фильтры",
      "expandRadius": "Расширить радиус",
      "clearFilters": "Сбросить фильтры",
      "browseAll": "Смотреть все"
    },
    "noFollowing": {
      "title": "Вы пока не подписаны ни на одну компанию",
      "description": "Откройте для себя местные компании и начните подписываться",
      "discoverCta": "Открыть компании"
    }
  },
  "loading": {
    "more": "Загрузка...",
    "skeleton": "Это все!"
  },
  "card": {
    "views": "{count} просмотров",
    "likes": "{count} лайков",
    "distance": "в {distance}"
  }
}
```

### 6. Ukrainian (uk) - feed.json

```json
{
  "sort": {
    "label": "Сортування",
    "algorithmic": "Для вас",
    "newest": "Найновіші",
    "popular": "Популярні",
    "trending": "У тренді",
    "following": "Підписки"
  },
  "filters": {
    "title": "Фільтри",
    "apply": "Застосувати фільтри",
    "clear": "Очистити все",
    "location": {
      "label": "Місцезнаходження",
      "radius": "Радіус",
      "detectLocation": "Визначити місцезнаходження",
      "detecting": "Визначення...",
      "wholeCountry": "Вся країна",
      "nearMe": "Поруч ({distance})",
      "radiusOptions": {
        "1km": "1 км",
        "5km": "5 км",
        "10km": "10 км",
        "25km": "25 км",
        "50km": "50 км",
        "all": "Вся країна"
      }
    },
    "categories": {
      "label": "Категорії",
      "placeholder": "Виберіть категорії...",
      "maxSelected": "Максимум {max} категорій"
    },
    "tags": {
      "label": "Теги",
      "placeholder": "Пошук тегів..."
    },
    "verifiedOnly": {
      "label": "Тільки перевірені",
      "description": "Показувати тільки shorts від перевірених компаній"
    },
    "activeFilters": "Активні фільтри: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Немає shorts у цьому районі",
      "description": "Спробуйте розширити радіус або змінити фільтри",
      "expandRadius": "Розширити радіус",
      "clearFilters": "Скинути фільтри",
      "browseAll": "Переглянути все"
    },
    "noFollowing": {
      "title": "Ви ще не підписані на жодну компанію",
      "description": "Відкрийте для себе місцеві компанії та почніть підписуватися",
      "discoverCta": "Відкрити компанії"
    }
  },
  "loading": {
    "more": "Завантаження...",
    "skeleton": "Це все!"
  },
  "card": {
    "views": "{count} переглядів",
    "likes": "{count} вподобань",
    "distance": "в {distance}"
  }
}
```

### 7. Polish (pl) - search.json

```json
{
  "bar": {
    "placeholder": "Szukaj shortow, firm, kategorii...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Ostatnie wyszukiwania",
    "popular": "Popularne wyszukiwania",
    "shorts": "Shorty",
    "companies": "Firmy",
    "clearRecent": "Wyczysc historie"
  },
  "tabs": {
    "all": "Wszystko",
    "shorts": "Shorty",
    "companies": "Firmy"
  },
  "results": {
    "title": "Wyniki dla \"{query}\"",
    "count": "{count} wynikow",
    "noResults": {
      "title": "Nie znaleziono wynikow dla \"{query}\"",
      "description": "Sprobuj innych slow kluczowych lub sprawdz pisownie",
      "suggestions": "Moze Cie zainteresowac:"
    }
  },
  "filters": {
    "inCategory": "w kategorii",
    "inLocation": "w lokalizacji"
  },
  "loading": "Szukanie..."
}
```

### 8. English (en) - search.json

```json
{
  "bar": {
    "placeholder": "Search shorts, companies, categories...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Recent searches",
    "popular": "Popular searches",
    "shorts": "Shorts",
    "companies": "Companies",
    "clearRecent": "Clear history"
  },
  "tabs": {
    "all": "All",
    "shorts": "Shorts",
    "companies": "Companies"
  },
  "results": {
    "title": "Results for \"{query}\"",
    "count": "{count} results",
    "noResults": {
      "title": "No results found for \"{query}\"",
      "description": "Try different keywords or check spelling",
      "suggestions": "You might be interested in:"
    }
  },
  "filters": {
    "inCategory": "in category",
    "inLocation": "in location"
  },
  "loading": "Searching..."
}
```

### 9. German (de) - search.json

```json
{
  "bar": {
    "placeholder": "Shorts, Unternehmen, Kategorien suchen...",
    "shortcut": "Strg+K"
  },
  "suggestions": {
    "recent": "Letzte Suchen",
    "popular": "Beliebte Suchen",
    "shorts": "Shorts",
    "companies": "Unternehmen",
    "clearRecent": "Verlauf loschen"
  },
  "tabs": {
    "all": "Alle",
    "shorts": "Shorts",
    "companies": "Unternehmen"
  },
  "results": {
    "title": "Ergebnisse fur \"{query}\"",
    "count": "{count} Ergebnisse",
    "noResults": {
      "title": "Keine Ergebnisse fur \"{query}\" gefunden",
      "description": "Versuche andere Schlusselworter oder uberprufe die Schreibweise",
      "suggestions": "Das konnte dich interessieren:"
    }
  },
  "filters": {
    "inCategory": "in Kategorie",
    "inLocation": "am Standort"
  },
  "loading": "Suche..."
}
```

### 10. Spanish (es) - search.json

```json
{
  "bar": {
    "placeholder": "Buscar shorts, empresas, categorias...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Busquedas recientes",
    "popular": "Busquedas populares",
    "shorts": "Shorts",
    "companies": "Empresas",
    "clearRecent": "Borrar historial"
  },
  "tabs": {
    "all": "Todo",
    "shorts": "Shorts",
    "companies": "Empresas"
  },
  "results": {
    "title": "Resultados para \"{query}\"",
    "count": "{count} resultados",
    "noResults": {
      "title": "No se encontraron resultados para \"{query}\"",
      "description": "Intenta con otras palabras clave o revisa la ortografia",
      "suggestions": "Te puede interesar:"
    }
  },
  "filters": {
    "inCategory": "en categoria",
    "inLocation": "en ubicacion"
  },
  "loading": "Buscando..."
}
```

### 11. Russian (ru) - search.json

```json
{
  "bar": {
    "placeholder": "Поиск shorts, компаний, категорий...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Недавние поиски",
    "popular": "Популярные поиски",
    "shorts": "Shorts",
    "companies": "Компании",
    "clearRecent": "Очистить историю"
  },
  "tabs": {
    "all": "Все",
    "shorts": "Shorts",
    "companies": "Компании"
  },
  "results": {
    "title": "Результаты для \"{query}\"",
    "count": "{count} результатов",
    "noResults": {
      "title": "Ничего не найдено по запросу \"{query}\"",
      "description": "Попробуйте другие ключевые слова или проверьте правописание",
      "suggestions": "Вам может быть интересно:"
    }
  },
  "filters": {
    "inCategory": "в категории",
    "inLocation": "в локации"
  },
  "loading": "Поиск..."
}
```

### 12. Ukrainian (uk) - search.json

```json
{
  "bar": {
    "placeholder": "Пошук shorts, компаній, категорій...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Нещодавні пошуки",
    "popular": "Популярні пошуки",
    "shorts": "Shorts",
    "companies": "Компанії",
    "clearRecent": "Очистити історію"
  },
  "tabs": {
    "all": "Все",
    "shorts": "Shorts",
    "companies": "Компанії"
  },
  "results": {
    "title": "Результати для \"{query}\"",
    "count": "{count} результатів",
    "noResults": {
      "title": "Нічого не знайдено за запитом \"{query}\"",
      "description": "Спробуйте інші ключові слова або перевірте правопис",
      "suggestions": "Вам може бути цікаво:"
    }
  },
  "filters": {
    "inCategory": "в категорії",
    "inLocation": "в локації"
  },
  "loading": "Пошук..."
}
```

### 13. i18n.ts Modification

Add feed and search namespaces to the i18n configuration:

```typescript
// In i18n.ts, add to the messages loading:

// Add to imports or message loading logic:
import plFeed from '@/lib/locales/pl/feed.json'
import enFeed from '@/lib/locales/en/feed.json'
import deFeed from '@/lib/locales/de/feed.json'
import esFeed from '@/lib/locales/es/feed.json'
import ruFeed from '@/lib/locales/ru/feed.json'
import ukFeed from '@/lib/locales/uk/feed.json'

import plSearch from '@/lib/locales/pl/search.json'
import enSearch from '@/lib/locales/en/search.json'
import deSearch from '@/lib/locales/de/search.json'
import esSearch from '@/lib/locales/es/search.json'
import ruSearch from '@/lib/locales/ru/search.json'
import ukSearch from '@/lib/locales/uk/search.json'

// Add to messages object for each locale:
const messages = {
  pl: { ...existing, feed: plFeed, search: plSearch },
  en: { ...existing, feed: enFeed, search: enSearch },
  de: { ...existing, feed: deFeed, search: deSearch },
  es: { ...existing, feed: esFeed, search: esSearch },
  ru: { ...existing, feed: ruFeed, search: ruSearch },
  uk: { ...existing, feed: ukFeed, search: ukSearch },
}
```

## Acceptance Criteria

- [ ] All 12 translation files created (6 languages x 2 namespaces)
- [ ] feed.json contains all keys: sort, filters, empty, loading, card
- [ ] search.json contains all keys: bar, suggestions, tabs, results, filters, loading
- [ ] i18n.ts updated to include feed and search namespaces
- [ ] All translations have proper Polish diacritics (where applicable)
- [ ] Russian and Ukrainian use Cyrillic characters
- [ ] German uses proper umlauts where appropriate
- [ ] Spanish uses proper accents where appropriate
- [ ] No missing translation keys
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000

### Steps

| Step | Action | Expected Result | URL/Notes |
|------|--------|-----------------|--------------|
| 1 | Navigate to /pl | Polish translations | Check sort dropdown |
| 2 | Navigate to /en | English translations | Check filter panel |
| 3 | Navigate to /de | German translations | Check empty state |
| 4 | Navigate to /es | Spanish translations | Check search bar |
| 5 | Navigate to /ru | Russian translations | Cyrillic text |
| 6 | Navigate to /uk | Ukrainian translations | Cyrillic text |

### Verification Checklist
- Sort dropdown shows localized options
- Filter panel shows localized labels
- Empty state shows localized messages
- Search bar shows localized placeholder

## Notes

1. **Character Encoding:** All files use UTF-8 encoding for proper display of special characters.

2. **Interpolation:** Keys with `{variable}` use next-intl interpolation syntax.

3. **Consistency:** Keep terminology consistent within each language (e.g., "shorts" vs translated term).

4. **Missing Keys:** If a key is missing, next-intl will show the key name. Use this to identify missing translations.
