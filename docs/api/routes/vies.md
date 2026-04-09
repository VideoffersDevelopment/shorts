# VIES API Route

API endpoint dla weryfikacji numerów VAT w systemie VIES (VAT Information Exchange System) Unii Europejskiej.

**Endpoint:** `POST /api/vies`
**Lokalizacja:** `src/app/api/vies/route.ts`
**Autoryzacja:** Wymagana (authenticated users)
**Rate Limiting:** 10 zapytań/minutę per user

---

## Przegląd

VIES API umożliwia weryfikację polskich numerów NIP w systemie VIES UE. Endpoint działa jako proxy między aplikacją a zewnętrznym SOAP API VIES.

### External VIES Service

**URL:** `https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl`
**Protokół:** SOAP 1.1
**Timeout:** 10 sekund
**Dostępność:** ~95% (może być niestabilny)

---

## Request

### Method

```
POST /api/vies
```

### Headers

```http
Content-Type: application/json
Authorization: Bearer <session_token>
```

### Body Schema

```typescript
{
  nip: string // 10 cyfr, tylko cyfry
}
```

### Przykład Request

```typescript
const response = await fetch('/api/vies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nip: '1234567890'
  })
});

const data = await response.json();
```

---

## Response

### Success (200 OK)

**NIP zweryfikowany:**
```json
{
  "valid": true,
  "companyName": "EXAMPLE SP. Z O.O.",
  "address": "UL. PRZYKŁADOWA 1\n00-001 WARSZAWA\nPOLAND"
}
```

**NIP niezweryfikowany:**
```json
{
  "valid": false
}
```

### Response Schema

```typescript
interface VIESResponse {
  valid: boolean;
  companyName?: string; // Tylko jeśli valid = true
  address?: string;     // Tylko jeśli valid = true
}
```

---

## Error Responses

### 400 Bad Request

**Przyczyna:** Nieprawidłowy format NIP

```json
{
  "error": "Invalid NIP format. Must be 10 digits."
}
```

**Walidacja:**
- NIP musi mieć dokładnie 10 cyfr
- Tylko cyfry (0-9)
- Bez myślników ani spacji

### 401 Unauthorized

**Przyczyna:** Brak sesji / niezalogowany użytkownik

```json
{
  "error": "Unauthorized"
}
```

### 429 Too Many Requests

**Przyczyna:** Przekroczenie rate limitu (10 req/min)

```json
{
  "error": "Rate limit exceeded. Try again in X seconds."
}
```

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703251200
```

### 503 Service Unavailable

**Przyczyna:** VIES API timeout lub niedostępny

```json
{
  "error": "VIES service temporarily unavailable. Please try again later."
}
```

**Retry-After Header:**
```http
Retry-After: 300
```

**Negative Cache:** Wynik cachowany przez 5 minut

### 500 Internal Server Error

**Przyczyna:** Nieoczekiwany błąd serwera

```json
{
  "error": "Internal server error"
}
```

---

## Implementacja

### Walidacja Input

```typescript
const nipRegex = /^[0-9]{10}$/;

if (!nipRegex.test(nip)) {
  return NextResponse.json(
    { error: 'Invalid NIP format. Must be 10 digits.' },
    { status: 400 }
  );
}
```

### Wywołanie VIES API

```typescript
import { verifyVAT } from '@/lib/vies';

try {
  const result = await verifyVAT(nip);
  return NextResponse.json(result);
} catch (error) {
  if (error.code === 'TIMEOUT') {
    return NextResponse.json(
      { error: 'VIES service temporarily unavailable' },
      { status: 503, headers: { 'Retry-After': '300' } }
    );
  }
  throw error;
}
```

### Retry Logic

**Implementacja w `src/lib/vies.ts`:**

```typescript
export async function verifyVAT(nip: string): Promise<VIESResponse> {
  let lastError: Error;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const client = await soap.createClientAsync(VIES_WSDL);
      const result = await Promise.race([
        client.checkVatAsync({
          countryCode: 'PL',
          vatNumber: nip
        }),
        timeout(10000) // 10s timeout
      ]);

      return {
        valid: result.valid,
        companyName: result.name,
        address: result.address
      };
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff: 2s, 4s
      }
    }
  }

  throw lastError;
}
```

**Retry Strategy:**
- Attempt 1: Immediate
- Attempt 2: Po 2 sekundach
- Attempt 3: Po 4 sekundach (total: 6s delay)

---

## Rate Limiting

### Implementacja

**Method:** In-memory Map (per user)

```typescript
const rateLimitMap = new Map<string, RateLimitEntry>();

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp
}

function checkRateLimit(userId: string): boolean {
  const entry = rateLimitMap.get(userId);
  const now = Date.now();

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= 10) {
    return false; // Limit exceeded
  }

  entry.count++;
  return true;
}
```

**Limit:** 10 zapytań per 60 sekund per user

**Reset:** Rolling window (60s od pierwszego zapytania)

---

## Caching

### Negative Caching

**Cel:** Redukcja obciążenia VIES API przy repeated failures

**Implementacja:**
```typescript
const negativeCache = new Map<string, number>();

// Po timeout/error:
negativeCache.set(nip, Date.now() + 300000); // Cache 5 min

// Przed wywołaniem VIES:
const cachedFailure = negativeCache.get(nip);
if (cachedFailure && cachedFailure > Date.now()) {
  return NextResponse.json(
    { error: 'VIES service temporarily unavailable' },
    { status: 503 }
  );
}
```

**TTL:** 5 minut

**Uwaga:** Positive results (valid = true/false) NIE są cachowane - zawsze fresh data.

---

## Monitoring

### Logs

**Successful verification:**
```typescript
console.log(`[VIES] NIP ${nip} verified: ${result.valid}`);
```

**Timeout:**
```typescript
console.error(`[VIES] Timeout for NIP ${nip} after 10s`);
```

**Rate limit:**
```typescript
console.warn(`[VIES] Rate limit exceeded for user ${userId}`);
```

### Metrics (Planned)

- Liczba zapytań per minutę
- Success rate (%)
- Average response time
- Timeout rate (%)

---

## Przykłady Użycia

### Client-Side (React)

```typescript
'use client';

import { useState } from 'react';

export function VIESChecker() {
  const [nip, setNip] = useState('');
  const [result, setResult] = useState<VIESResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={nip}
        onChange={(e) => setNip(e.target.value)}
        placeholder="1234567890"
        maxLength={10}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Weryfikacja...' : 'Sprawdź'}
      </button>

      {result && (
        <div>
          {result.valid ? (
            <>
              <p>✓ Firma zweryfikowana</p>
              <p>{result.companyName}</p>
              <p>{result.address}</p>
            </>
          ) : (
            <p>✗ NIP nie został zweryfikowany</p>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Server-Side (Server Action)

```typescript
// src/app/actions/companies/upgrade.ts
import { verifyVAT } from '@/lib/vies';

export async function upgrade(data: UpgradeInput) {
  // Walidacja NIP przez API route (via fetch)
  const viesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/vies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nip: data.nip })
  });

  const viesResult = await viesResponse.json();

  if (!viesResult.valid) {
    return {
      success: false,
      error: 'NIP nie został zweryfikowany w systemie VIES',
      code: 'VIES_FAILED'
    };
  }

  // Continue with upgrade...
}
```

---

## Testy

**Lokalizacja:** `src/app/api/vies/__tests__/route.test.ts`

**Test Suites:** 1

**Total Tests:** 44

**Coverage:** ~90%

### Test Scenarios

- ✅ Successful verification (valid NIP)
- ✅ Unsuccessful verification (invalid NIP)
- ✅ Invalid NIP format (400)
- ✅ Unauthorized (401)
- ✅ Rate limit exceeded (429)
- ✅ VIES timeout (503)
- ✅ Retry logic (3 attempts)
- ✅ Negative caching (5 min)

**Mocking VIES API:**
```typescript
vi.mock('@/lib/vies', () => ({
  verifyVAT: vi.fn()
}));

// Test case:
(verifyVAT as Mock).mockResolvedValue({
  valid: true,
  companyName: 'TEST SP. Z O.O.',
  address: 'TEST ADDRESS'
});
```

---

## Bezpieczeństwo

### 1. Input Validation

- ✅ Regex validation (10 cyfr)
- ✅ Sanitization (tylko cyfry)
- ✅ Max length check

### 2. Rate Limiting

- ✅ Per-user limits
- ✅ 429 response z headers

### 3. Authentication

- ✅ Session required
- ✅ 401 dla niezalogowanych

### 4. Error Handling

- ✅ Nie leakuje szczegółów błędów
- ✅ Generic error messages

---

## Troubleshooting

### Problem: VIES API często timeout

**Objawy:** 503 Service Unavailable
**Przyczyna:** VIES API niestabilny (szczególnie wieczorami)
**Rozwiązanie:**
- Retry logic (3 próby)
- Negative cache (5 min)
- Fallback: Manual verification przez admina

### Problem: Rate limit za niski

**Objawy:** 429 Too Many Requests
**Przyczyna:** Użytkownik sprawdza wiele NIPów
**Rozwiązanie:** Zwiększyć limit z 10 na 20 per minute

---

## Powiązana Dokumentacja

- [Companies Upgrade Action](../server-actions/companies.md#upgrade)
- [VIES Integration Guide](../../features/companies/vies-integration.md)
- [VIES Utils](../../guides/vies-utils.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
