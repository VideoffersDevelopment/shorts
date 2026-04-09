# OPIS DZIAŁANIA APLIKACJI

## Video Shorts - Platforma Promocji Produktów

**Dokument dla Klienta**  
**Data:** 22.10.2025  
**Wersja:** 1.0

---

## 📱 Czym Jest Ta Aplikacja?

**Video Shorts** to nowoczesna platforma webowa (z planami na aplikację mobilną) umożliwiająca firmom **promocję swoich produktów** poprzez krótkie, pionowe filmy - podobnie jak TikTok czy Instagram Reels, ale **skupiona na sprzedaży**.

### Główna Idea

Firmy publikują **krótkie filmy produktowe** (do 60 sekund), a użytkownicy mogą:

- Przeglądać je w nieskończonym feedzie
- Reagować i komentować
- **Kliknąć "Kup teraz"** i przejść bezpośrednio do sklepu

---

## 👥 Typy Użytkowników

### 1. Zwykły Użytkownik (Oglądający)

**Kim jest?**

- Osoba szukająca inspiracji zakupowych
- Może przeglądać bez konta
- Może się zarejestrować dla pełnych funkcji

**Co może robić?**

- ✅ Przeglądać shortsy BEZ logowania
- ✅ Filtrować po lokalizacji, kategoriach
- ✅ Po zalogowaniu: komentować, reagować
- ✅ Followować ulubione firmy
- ✅ Zgłaszać nieodpowiednie treści

### 2. Firma (Sprzedawca)

**Kim jest?**

- Właściciel sklepu/firmy
- Chce promować swoje produkty
- Płaci za każdy opublikowany shorts

**Co może robić?**

- ✅ Uploadować shortsy produktowe
- ✅ Zarządzać swoim profilem firmowym
- ✅ Oglądać statystyki (wyświetlenia, kliknięcia)
- ✅ Odpowiadać na komentarze
- ✅ Edytować/usuwać swoje shortsy

### 3. Administrator

**Kim jest?**

- Zarządzający platformą
- Moderator treści

**Co może robić?**

- ✅ Moderować shortsy i komentarze
- ✅ Banować użytkowników
- ✅ Przeglądać zgłoszenia
- ✅ Zarządzać kategoriami
- ✅ Oglądać statystyki globalne

---

## 🎬 Jak Działa Aplikacja - Krok Po Kroku

### Scenariusz 1: Użytkownik Przegląda Shortsy

#### Krok 1: Wejście na Stronę

```
Użytkownik → Otwiera stronę www.videoshorts.pl
           ↓
System → Pyta o lokalizację (opcjonalnie)
       → "Czy możemy poznać Twoją lokalizację, aby pokazywać
          lokalne produkty?"
           ↓
Użytkownik → Akceptuje / Odmawia / Zamyka
```

**Dlaczego lokalizacja?**

- Pokazujemy produkty z lokalnych sklepów
- Użytkownik widzi oferty z swojego miasta/regionu
- Nie jest wymagana - można przeglądać bez niej

#### Krok 2: Przeglądanie Feedu

```
┌─────────────────────────────────────┐
│  🏠 Video Shorts                    │
├─────────────────────────────────────┤
│  📍 Kraków, PL  [Zmień]  🔍 Szukaj  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │     WIDEO PRODUKTU            │ │
│  │     (pionowe, 60 sek)         │ │
│  │                               │ │
│  │  "Nike Air Max - nowa kolekcja"│
│  │                               │ │
│  │  [▶️ PLAY]                    │ │
│  │                               │ │
│  │  👍 1.2K  💬 43  ↗️ Share     │ │
│  │                               │ │
│  │  🛒 KUP TERAZ - 499 PLN       │ │
│  │                               │ │
│  │  @SklePSportowy Kraków         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ↓ Scrolluj dla następnego          │
└─────────────────────────────────────┘
```

**Jak działa scrollowanie?**

- Jak TikTok - pionowy scroll
- Nieskończony feed - zawsze nowe shortsy
- Automatyczne preloadowanie następnego wideo
- Płynne przejścia

#### Krok 3: Interakcja z Shortsem

**Użytkownik może:**

1. **Obejrzeć wideo**

   - Automatyczne odtwarzanie
   - Kontrolki: pause, volume, fullscreen
   - Wskaźnik postępu

2. **Zareagować**

   - 👍 Like (publiczny licznik)
   - 👎 Dislike (widzi tylko właściciel)
   - 😍🔥👏 Emoji reakcje

3. **Skomentować** (wymaga konta)

   ```
   💬 43 komentarzy

   @Anna_K: "Gdzie mogę to kupić?"
   └─ @SklepSportowy: "Link w opisie! 😊"

   @Janek92: "Super buty! 👟"

   [Dodaj komentarz...]
   ```

4. **Kliknąć "Kup Teraz"**

   ```
   Użytkownik → Klika 🛒 KUP TERAZ
              ↓
   System → Rejestruje kliknięcie (analytics)
          → Otwiera sklep w nowej karcie
              ↓
   Użytkownik → Trafia na stronę produktu w sklepie firmy
   ```

5. **Share (Udostępnij)**
   - Facebook
   - Twitter
   - WhatsApp
   - Kopiuj link

#### Krok 4: Filtrowanie

```
┌─────────────────────────────────────┐
│  🔍 FILTRY                          │
├─────────────────────────────────────┤
│  📍 Lokalizacja                     │
│     • Kraków                        │
│     • Polska                        │
│     • Europa                        │
│                                     │
│  🏷️ Kategorie                       │
│     ☑️ Sport i Fitness              │
│     ☐ Moda                          │
│     ☐ Elektronika                   │
│     ☐ Dom i Ogród                   │
│                                     │
│  🏷️ Tagi                            │
│     #buty #nike #sport              │
│                                     │
│  🔄 Sortowanie                      │
│     • Najnowsze                     │
│     • Najpopularniejsze             │
│     • Trending                      │
└─────────────────────────────────────┘
```

---

### Scenariusz 2: Firma Publikuje Shortsa

#### Krok 1: Rejestracja/Logowanie Firmy

```
Firma → Wchodzi na stronę
      → Klika "Dla Firm" / "Zaloguj"
      ↓
System → Formularz rejestracji:
         • Email
         • Hasło
         • Nazwa firmy (opcjonalnie na start)
      ↓
Firma → Potwierdza email
      → Loguje się do panelu
```

#### Krok 2: Uzupełnienie Profilu Firmowego

```
┌─────────────────────────────────────────┐
│  🏢 PROFIL FIRMY                        │
├─────────────────────────────────────────┤
│                                         │
│  📸 Logo firmy: [Upload]                │
│  🖼️ Zdjęcie w tle: [Upload]            │
│                                         │
│  🏷️ Nazwa: ___________________          │
│  📝 Opis:                               │
│     _________________________________   │
│     _________________________________   │
│                                         │
│  🌐 Strona www: ___________________     │
│  📧 Email: _______________________      │
│  📱 Telefon: _____________________      │
│                                         │
│  📍 Lokalizacja:                        │
│     Miasto: _________                   │
│     Kraj: ___________                   │
│                                         │
│  [💾 Zapisz]                            │
└─────────────────────────────────────────┘
```

**Profil firmowy jest jak kanał YouTube:**

- Wszystkie shortsy firmy w jednym miejscu
- Liczba followersów
- Statystyki (wyświetlenia, engagement)
- Link do strony www

#### Krok 3: Upload Shortsa

```
┌─────────────────────────────────────────┐
│  📹 NOWY SHORTS                         │
├─────────────────────────────────────────┤
│                                         │
│  1️⃣ UPLOAD WIDEO                        │
│     ┌─────────────────────────────┐    │
│     │  Przeciągnij wideo tutaj    │    │
│     │  lub kliknij aby wybrać     │    │
│     │                             │    │
│     │  Maks: 60 sek, 10 MB        │    │
│     │  Format: MP4, MOV           │    │
│     └─────────────────────────────┘    │
│                                         │
│  2️⃣ SZCZEGÓŁY                           │
│     📝 Tytuł:                           │
│        ____________________________     │
│                                         │
│     📄 Opis:                            │
│        ____________________________     │
│        ____________________________     │
│                                         │
│     🏷️ Kategoria: [Wybierz ▼]          │
│     🏷️ Tagi: #tag1 #tag2 #tag3         │
│                                         │
│  3️⃣ PRODUKT                             │
│     🛒 Link do produktu:                │
│        ____________________________     │
│                                         │
│     💰 Cena (opcjonalnie):              │
│        _______ PLN                      │
│                                         │
│  4️⃣ LOKALIZACJA                         │
│     📍 Miasto: __________               │
│     🌍 Kraj: ____________               │
│                                         │
│  5️⃣ STATUS                              │
│     ⚪ Zapisz jako szkic                │
│     🟢 Opublikuj teraz                  │
│                                         │
│  [💾 Zapisz]  [🗑️ Anuluj]              │
└─────────────────────────────────────────┘
```

**Co dzieje się po kliknięciu "Zapisz"?**

```
Firma → Klika "Opublikuj teraz"
       ↓
System → 1. Walidacja wideo (format, rozmiar, czas)
         2. Upload na serwer VPS
         3. Dodanie do kolejki przetwarzania
         4. Shorts zapisany jako "Processing"
       ↓
       [W TLE - Worker Process]
       1. FFmpeg transkoduje wideo
          → 1080p (Full HD)
          → 720p (HD)
          → 480p (SD)
       2. Generuje miniaturkę
       3. Upload do CDN
       4. Zmiana statusu na "Published"
       ↓
Firma → Otrzymuje powiadomienie:
        "✅ Twój shorts został opublikowany!"
       ↓
Shorts → Pojawia się w feedzie użytkowników
```

**Przetwarzanie wideo trwa:** 2-5 minut (w zależności od długości)

#### Krok 4: Płatność (Pay-per-Video)

```
Firma → Klika "Opublikuj" pierwszy raz
       ↓
System → Przekierowanie do Stripe
         "Opublikuj swój pierwszy shorts za 19.99 PLN"
         [💳 Zapłać kartą]
       ↓
Firma → Płaci kartą (Stripe)
       ↓
System → Potwierdza płatność
         → Publikuje shortsa
         → Wystawia fakturę (automatycznie)
```

**Model płatności:**

- Płatność za każdy opublikowany shorts
- Cena: do ustalenia (np. 19.99 PLN/shorts)
- Stripe obsługuje płatności
- Automatyczne faktury
- Historia płatności w panelu firmy

#### Krok 5: Dashboard Firmy

```
┌─────────────────────────────────────────┐
│  📊 DASHBOARD FIRMY                     │
├─────────────────────────────────────────┤
│                                         │
│  📈 STATYSTYKI (ostatnie 30 dni)        │
│  ┌────────────────────────────────┐    │
│  │  👁️ Wyświetlenia: 12,453       │    │
│  │  👍 Polubienia: 1,842          │    │
│  │  💬 Komentarze: 234            │    │
│  │  🛒 Kliknięcia "Kup": 387      │    │
│  │  📈 CTR: 3.1%                  │    │
│  └────────────────────────────────┘    │
│                                         │
│  📹 TWOJE SHORTSY (5)                   │
│  ┌────────────────────────────────┐    │
│  │  📹 Nike Air Max                │    │
│  │     👁️ 3.2K  👍 456  💬 32      │    │
│  │     🛒 89 kliknięć              │    │
│  │     [✏️ Edytuj] [🗑️ Usuń]       │    │
│  ├────────────────────────────────┤    │
│  │  📹 Adidas Ultra Boost          │    │
│  │     👁️ 2.1K  👍 312  💬 18      │    │
│  │     🛒 54 kliknięcia            │    │
│  │     [✏️ Edytuj] [🗑️ Usuń]       │    │
│  └────────────────────────────────┘    │
│                                         │
│  💬 OSTATNIE KOMENTARZE (3)             │
│  ┌────────────────────────────────┐    │
│  │  @Anna_K: "Gdzie to kupić?"     │    │
│  │  [↩️ Odpowiedz]                 │    │
│  └────────────────────────────────┘    │
│                                         │
│  [➕ Dodaj Nowy Shorts]                 │
└─────────────────────────────────────────┘
```

**Statystyki dla każdego shortsa:**

- 👁️ Liczba wyświetleń
- ⏱️ Średni czas oglądania
- 👍 Reakcje (like, emoji)
- 💬 Liczba komentarzy
- 🛒 Kliknięcia "Kup teraz"
- 📈 CTR (Click-Through Rate)
- 📊 Wykresy w czasie

---

### Scenariusz 3: Administrator Moderuje Platformę

#### Dashboard Administratora

```
┌─────────────────────────────────────────┐
│  👨‍💼 PANEL ADMINISTRATORA                 │
├─────────────────────────────────────────┤
│                                         │
│  📊 STATYSTYKI GLOBALNE                 │
│  ┌────────────────────────────────┐    │
│  │  👥 Użytkownicy: 15,432         │    │
│  │  🏢 Firmy: 234                  │    │
│  │  📹 Shortsy: 1,847              │    │
│  │  👁️ Wyświetlenia dzisiaj: 45.2K │    │
│  │  🛒 Kliknięcia: 1,234           │    │
│  └────────────────────────────────┘    │
│                                         │
│  🚨 ZGŁOSZENIA (12 nowych)              │
│  ┌────────────────────────────────┐    │
│  │  🚫 Spam - Shorts #8473         │    │
│  │     Zgłoszeń: 8/10              │    │
│  │     [👁️ Przejrzyj]              │    │
│  ├────────────────────────────────┤    │
│  │  🚫 Nieodpowiednia treść        │    │
│  │     Zgłoszeń: 5/10              │    │
│  │     [👁️ Przejrzyj]              │    │
│  └────────────────────────────────┘    │
│                                         │
│  👥 ZARZĄDZANIE UŻYTKOWNIKAMI           │
│  [🔍 Szukaj użytkownika...]            │
│                                         │
│  📹 MODERACJA SHORTSÓW                  │
│  [🔍 Przeglądaj wszystkie shortsy]     │
│                                         │
│  ⚙️ USTAWIENIA SYSTEMU                  │
│  • Maks. czas wideo: [60] sekund       │
│  • Maks. rozmiar: [10] MB              │
│  • Prog zgłoszeń: [10] zgłoszeń        │
│  • Kategorie: [Zarządzaj]              │
│                                         │
└─────────────────────────────────────────┘
```

#### Moderacja Zgłoszenia - Krok Po Kroku

```
Admin → Klika "Przejrzyj" na zgłoszeniu
       ↓
System → Pokazuje ekran moderacji:

┌─────────────────────────────────────────┐
│  🚨 ZGŁOSZENIE #8473                    │
├─────────────────────────────────────────┤
│                                         │
│  📹 SHORTS:                             │
│  ┌─────────────────────────────────┐   │
│  │  [▶️ Podgląd wideo]             │   │
│  │                                 │   │
│  │  Tytuł: "Kup teraz!"            │   │
│  │  Firma: @SuspiciousShop         │   │
│  │  Opublikowano: 2 dni temu       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📝 ZGŁOSZENIA (8):                     │
│  • Spam (5x)                            │
│  • Wprowadza w błąd (2x)                │
│  • Nieodpowiednia treść (1x)            │
│                                         │
│  👤 FIRMA:                              │
│  • Nazwa: Suspicious Shop               │
│  • Shortsy: 23 (12 zgłoszonych)        │
│  • Konto utworzone: 1 tydzień temu     │
│                                         │
│  ⚖️ DECYZJA:                            │
│  ⚪ Odrzuć zgłoszenie                   │
│  🟡 Usuń shortsa                        │
│  🟠 Usuń + ostrzeż firmę                │
│  🔴 Usuń + zbanuj firmę                 │
│                                         │
│  💬 Notatka (opcjonalnie):              │
│  _____________________________________  │
│                                         │
│  [✅ Wykonaj] [❌ Anuluj]               │
└─────────────────────────────────────────┘

Admin → Wybiera akcję → Klika "Wykonaj"
       ↓
System → Wykonuje akcję:
         • Usuwa shortsa (jeśli wybrano)
         • Wysyła powiadomienie do firmy
         • Banuje konto (jeśli wybrano)
         • Zamyka zgłoszenie jako "resolved"
```

#### Automatyczna Blokada

```
Shorts → Otrzymuje 10. zgłoszenie
        ↓
System → AUTOMATYCZNIE:
         1. Ukrywa shortsa
         2. Zmienia status na "Blocked - Pending Review"
         3. Wysyła powiadomienie do admina
         4. Wysyła email do firmy:
            "Twój shorts został tymczasowo ukryty
             z powodu zgłoszeń. Trwa weryfikacja."
        ↓
Admin → Dostaje powiadomienie
       → Przegląda zgłoszenie
       → Podejmuje decyzję
```

---

## 🎯 Kluczowe Funkcje - Szczegóły

### 1. System Powiadomień

**Użytkownik otrzymuje powiadomienia gdy:**

- ✉️ Ktoś odpowie na jego komentarz
- 👍 Komentarz dostanie like
- 🔔 Followowana firma opublikuje nowy shorts

**Firma otrzymuje powiadomienia gdy:**

- 💬 Ktoś skomentuje jej shortsa
- 🚨 Shorts został zgłoszony
- ✅ Shorts został przetworzony i opublikowany
- 💰 Płatność została potwierdzona

**Typy powiadomień:**

- 📧 Email (zawsze)
- 🔔 In-app (w aplikacji, bell icon)
- 📱 Push (w przyszłości - mobile app)

### 2. System Reakcji

**Like/Dislike:**

```
Użytkownik → Klika 👍
            ↓
System → Sprawdza czy user jest zalogowany
         • TAK → Dodaje like, aktualizuje licznik
         • NIE → Pokazuje "Zaloguj się aby polubić"
```

**Emoji Reactions:**

```
┌─────────────────────────────┐
│  Wybierz reakcję:           │
│  😍 Uwielbiam (234)         │
│  🔥 Hot! (189)              │
│  👏 Brawo (156)             │
│  😮 Wow (98)                │
│  🤔 Hmm... (45)             │
└─────────────────────────────┘
```

**Dislike:**

- Widoczny TYLKO dla właściciela shortsa
- Pomaga firmom zrozumieć co nie działa
- Nie wpływa na ranking w feedzie

### 3. Filtrowanie i Search

**Geolokalizacja:**

```
System → Prosi o lokalizację przy pierwszym wejściu
       → "Pokaż mi produkty z mojej okolicy"
       ↓
Użytkownik → Akceptuje
            ↓
System → Zapisuje lokalizację (miasto, kraj)
         → Przypomina o zgodzie co 30 dni
         → Użytkownik może zmienić w każdej chwili
```

**Sortowanie:**

- 🆕 **Najnowsze** - chronologicznie
- 🔥 **Trending** - algorytm: likes/czas
- 👁️ **Najpopularniejsze** - total views

**Search:**

```
🔍 Szukaj...
   └─ Sugestie:
       • Shortsy: "Nike Air Max"
       • Firmy: "@SklepSportowy"
       • Tagi: "#buty #sport"
       • Kategorie: "Sport i Fitness"
```

### 4. Follow System

**Followowanie firmy:**

```
Użytkownik → Wchodzi na profil firmy
           → Klika [+ Follow]
           ↓
System → Dodaje do listy followowanych
         → Użytkownik dostaje powiadomienia o nowych shortsach
         ↓
Firma → Widzi nowego followera w statystykach
```

**Korzyści:**

- Użytkownik: Dostaje powiadomienia o nowych produktach
- Firma: Buduje bazę lojalnych klientów

---

## 🔒 Bezpieczeństwo i Moderacja

### Zgłaszanie Treści

**Użytkownik może zgłosić:**

- 📹 Shortsa
- 💬 Komentarz

**Powody zgłoszenia:**

- 🚫 Spam
- ⚠️ Nieodpowiednia treść
- 🎭 Wprowadzające w błąd
- © Naruszenie praw autorskich
- 💔 Mowa nienawiści

**Proces:**

```
Użytkownik → Klika "Zgłoś"
           → Wybiera powód
           → Opcjonalnie: dodaje komentarz
           ↓
System → Zapisuje zgłoszenie
         → Jeśli osiągnięto próg (10 zgłoszeń):
            • Automatycznie ukrywa treść
            • Powiadamia admina
         → Jeśli nie:
            • Dodaje do kolejki do przeglądu
```

### Bany i Kary

**Admin może:**

- ⚠️ **Ostrzeżenie** - email + notyfikacja
- ⏸️ **Zawieszenie** - temporary ban (7/30 dni)
- 🚫 **Permanentny ban** - usunięcie konta

**Co się dzieje przy banie:**

```
Admin → Banuje użytkownika/firmę
       ↓
System → 1. Ukrywa wszystkie shortsy firmy
         2. Blokuje logowanie
         3. Wysyła email z informacją
         4. (Opcjonalnie) Możliwość odwołania
```

---

## 📊 Analytics i Statystyki

### Dla Firmy

**Podstawowe metryki:**

- 👁️ **Wyświetlenia** - ile razy shorts był wyświetlony
- ⏱️ **Avg. watch time** - średni czas oglądania
- 👍 **Engagement rate** - (likes + comments) / views
- 🛒 **CTR** - Click-Through Rate (kliknięcia / views)
- 📈 **Trend** - porównanie z poprzednim okresem

**Zaawansowane (Faza 3):**

- 📊 Wykresy w czasie
- 🔥 Najlepiej performujące shortsy
- 👥 Demografia widzów
- 📍 Skąd przychodzą użytkownicy
- 🕐 Najlepsze godziny publikacji

### Dla Admina

**Globalne statystyki:**

- 👥 Aktywni użytkownicy (DAU/MAU)
- 📹 Liczba publikowanych shortsów
- 💰 Przychody (z płatności)
- 🚨 Liczba zgłoszeń
- 📈 Wzrost platformy

---

## 💳 Model Biznesowy - Szczegóły

### Pay-per-Video

**Jak to działa:**

```
Firma → Chce opublikować shortsa
       ↓
System → "Zapłać 19.99 PLN aby opublikować"
       ↓
Firma → Płaci przez Stripe
       ↓
System → 1. Potwierdza płatność
         2. Publikuje shortsa
         3. Wystawia fakturę (PDF)
         4. Wysyła email z fakturą
```

**Opcje płatności:**

- 💳 Karta kredytowa/debetowa
- 🏦 Przelew bankowy
- 📱 BLIK (opcjonalnie)

**Faktury:**

- Automatyczne wystawianie
- Generowanie PDF
- Wysyłka email
- Dostęp w panelu (historia płatności)

**Stripe - dlaczego?**

- ✅ Bezpieczne płatności
- ✅ Automatyczne faktury
- ✅ Obsługa reklamacji
- ✅ Dashboard dla firm

---

## 🚀 Przyszłe Funkcje (Roadmap)

### Faza 4: Aplikacja Mobile

**iOS + Android**

- 📱 Natywna aplikacja
- 📷 Upload bezpośrednio z kamery
- 🔔 Push notifications
- 📍 Lepsza geolokalizacja
- 💾 Tryb offline (cache shortsów)

### Dodatkowe Pomysły

**Dla użytkowników:**

- 💝 Wishlist / Ulubione
- 🎁 Kupony rabatowe w shortsach
- 👥 Social features - tag znajomych
- 📦 Tracking zamówień (integracja z sklepami)

**Dla firm:**

- 📅 Scheduled publishing
- 🎨 Video editor wbudowany
- 📊 A/B testing shortsów
- 🤝 Współpraca z influencerami
- 📢 Boosted posts (promocja płatna)

**Dla platformy:**

- 🤖 AI moderacja treści
- 🎯 Personalizowany feed (AI recommendations)
- 💬 Live shopping (live streaming)
- 🌍 Multi-język

---

## ❓ FAQ - Najczęściej Zadawane Pytania

### Dla Użytkowników

**Q: Czy muszę się rejestrować aby przeglądać?**
A: Nie! Możesz przeglądać shortsy bez konta. Rejestracja jest potrzebna tylko do komentowania i reakcji.

**Q: Czy muszę podać lokalizację?**
A: Nie, jest opcjonalna. Pomaga pokazywać lokalne produkty, ale nie jest wymagana.

**Q: Czy aplikacja jest bezpłatna?**
A: Tak! Dla użytkowników jest całkowicie darmowa.

**Q: Co jeśli zobaczę nieodpowiednią treść?**
A: Możesz ją zgłosić. Po 10 zgłoszeniach zostanie automatycznie ukryta.

### Dla Firm

**Q: Ile kosztuje publikacja shortsa?**
A: Model pay-per-video - płacisz za każdy opublikowany shorts (np. 19.99 PLN).

**Q: Jak długi może być shorts?**
A: Maksymalnie 60 sekund (edytowalne przez admina).

**Q: Czy mogę edytować shorts po publikacji?**
A: Tak, możesz edytować metadane (tytuł, opis, link), ale nie samo wideo.

**Q: Jakie formaty wideo są akceptowane?**
A: MP4, MOV i inne popularne formaty. Maks. 10 MB.

**Q: Ile czasu trwa przetwarzanie wideo?**
A: 2-5 minut w zależności od długości.

**Q: Czy dostaję statystyki?**
A: Tak! Pełne statystyki dla każdego shortsa (views, clicks, engagement).

### Dla Adminów

**Q: Jak działa automatyczna blokada?**
A: Po osiągnięciu progu zgłoszeń (domyślnie 10) shorts jest automatycznie ukrywany do przeglądu.

**Q: Czy mogę zmienić parametry systemu?**
A: Tak, w panelu admina możesz edytować limity (czas wideo, rozmiar, próg zgłoszeń).

---

## 🎨 Design i UX

### Mobilny First

Aplikacja projektowana z myślą o urządzeniach mobilnych:

- 📱 Pionowe wideo (9:16)
- 👆 Intuicyjne gesty (swipe, tap)
- ⚡ Szybkie ładowanie
- 🎯 Minimalistyczny interface

### Inspiracje Design

- **TikTok** - infinite scroll, vertical video
- **Instagram Reels** - UI/UX interactions
- **YouTube** - profile firmowe, komentarze
- **Amazon** - "Kup teraz" button, product links

### Kolory i Branding

- 🎨 Nowoczesny, czysty design
- 🌈 Kontrastowe kolory dla CTA
- 🖤 Dark mode friendly
- ♿ Accessibility (WCAG 2.1)

---

## 🏁 Podsumowanie dla Klienta

### Czym się wyróżniamy?

✅ **Focus na sprzedaż** - nie social media, tylko e-commerce  
✅ **Geolokalizacja** - lokalne produkty, lokalny biznes  
✅ **Prosty model** - pay-per-video, bez subskrypcji  
✅ **Pełne statystyki** - firmy widzą ROI  
✅ **Moderacja** - bezpieczna platforma

### Główne User Flows

1. **Użytkownik** → Browse → React → Click "Kup" → Sklep
2. **Firma** → Upload → Pay → Publish → Track stats
3. **Admin** → Monitor → Moderate → Manage → Optimize

### Value Proposition

**Dla użytkowników:**

- Odkrywanie nowych produktów w zabawny sposób
- Lokalne oferty
- Bezpośredni link do zakupu

**Dla firm:**

- Tani marketing (pay-per-video)
- Dotarcie do lokalnych klientów
- Mierzalne wyniki (CTR, clicks)
- Łatwe w użyciu

**Dla platformy:**

- Skalowalny model biznesowy
- Network effect (więcej firm = więcej użytkowników)
- Możliwość dodatkowej monetyzacji (promoted posts)
