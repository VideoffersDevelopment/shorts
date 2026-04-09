# Debug Guide - Short Player Issue

## Symptom
Player nie pojawia się na stronie `/panel/shorts/cmk9sblpv0000g876p6j4merd`

## Debugging Steps

### 1. Sprawdź Console w Chrome DevTools (F12)

Otwórz DevTools i szukaj:
- **Błędy React** (czerwone)
- **Network errors** (404, 403)
- **Console warnings**

### 2. Sprawdź Response dla Strony

W DevTools → Network tab:
1. Odśwież stronę (F5)
2. Znajdź request do `/panel/shorts/cmk9sblpv0000g876p6j4merd`
3. W Preview tab sprawdź HTML - czy `<ShortDetailPlayer>` jest w DOM?

### 3. Sprawdź Status Shorta w Bazie

Uruchom w terminalu:
```bash
# Otwórz Prisma Studio
npx prisma studio
```

Następnie:
1. Otwórz tabelę `Short`
2. Znajdź rekord z ID: `cmk9sblpv0000g876p6j4merd`
3. Sprawdź pola:
   - `status` - jaki jest? (DRAFT/PROCESSING/PUBLISHED?)
   - `hlsPlaylistUrl` - czy jest wypełnione?
   - `rawVideoKey` - czy istnieje?

### 4. Test API Endpointu

W terminalu:
```bash
# Test raw video URL (wymaga zalogowania)
curl http://localhost:3000/api/shorts/cmk9sblpv0000g876p6j4merd/raw-video-url
```

Oczekiwane odpowiedzi:
- **200 + URL**: ✅ Raw video dostępne
- **403 "Raw video only available during processing"**: Short nie jest w PROCESSING
- **404 "Short not found"**: Unauthorized lub błędne ID
- **401 "Unauthorized"**: Nie zalogowany

### 5. Dodaj Temporary Debug Logs

Edytuj `src/components/shorts/short-detail-player.tsx`:

```typescript
export function ShortDetailPlayer({ ... }: ShortDetailPlayerProps) {
  const [status, setStatus] = useState(initialStatus)
  const [hlsPlaylistUrl, setHlsPlaylistUrl] = useState(initialHlsUrl)
  const [rawVideoUrl, setRawVideoUrl] = useState<string | null>(null)

  // 🐛 DEBUG LOG
  console.log('ShortDetailPlayer render:', {
    shortId,
    status,
    hlsPlaylistUrl,
    rawVideoUrl,
    hasVideo: !!(hlsPlaylistUrl || rawVideoUrl)
  })

  // ... rest of component
}
```

Odśwież stronę i sprawdź console - zobaczysz dokładnie co jest przekazywane.

### 6. Sprawdź Rendering Paths

Component ma 4 możliwe ścieżki renderowania:

```typescript
// Path 1: Player (jeśli hasVideo)
if (hasVideo) return <ShortPlayer ... />

// Path 2: Processing placeholder
if (status === 'PROCESSING' || status === 'PENDING_PAYMENT') return <div>Processing...</div>

// Path 3: Thumbnail fallback
return <div>{thumbnailUrl ? <img /> : 'Brak miniatury'}</div>
```

W DevTools → Elements tab sprawdź która z tych divów jest renderowana.

## Najbardziej Prawdopodobne Przyczyny

### Przypadek A: Short jest DRAFT
**Symptom**: Widzisz thumbnail lub "Brak miniatury"
**Przyczyna**: `status = 'DRAFT'` i brak `hlsPlaylistUrl`
**Rozwiązanie**: Opublikuj short lub zmień status na PROCESSING/PUBLISHED

### Przypadek B: Short jest PUBLISHED ale brak hlsPlaylistUrl
**Symptom**: Widzisz thumbnail (po mojej poprawce powinien pokazać się player)
**Przyczyna**: QENCODE nie zakończył przetwarzania lub wystąpił błąd
**Rozwiązanie**: Sprawdź `processingError` w bazie lub logi Inngest

### Przypadek C: Short jest PROCESSING ale raw video fetch failuje
**Symptom**: Widzisz "Processing..." placeholder z pulsing animation
**Przyczyna**: `/api/shorts/[id]/raw-video-url` zwraca error
**Rozwiązanie**: Sprawdź czy `rawVideoKey` istnieje w bazie

## Quick Fix Commands

```bash
# Reset shorta do PROCESSING (jeśli utknął)
npx prisma studio
# → Zmień status shorta na PROCESSING ręcznie

# Restart dev server (czasem pomaga)
npm run dev

# Clear Next.js cache
rm -rf .next
npm run dev
```

## Expected Working Scenario

Dla shorta w statusie **PUBLISHED**:
1. `hlsPlaylistUrl` !== null → Shows ShortPlayer with HLS
2. Console log: "ShortDetailPlayer render: { status: 'PUBLISHED', hlsPlaylistUrl: 'https://...', hasVideo: true }"

Dla shorta w statusie **PROCESSING**:
1. Fetch `/api/shorts/.../raw-video-url` → `rawVideoUrl` set
2. Shows ShortPlayer with raw video + "Przetwarzanie w tle..." badge
3. Console log: "ShortDetailPlayer render: { status: 'PROCESSING', rawVideoUrl: 'https://...', hasVideo: true }"
