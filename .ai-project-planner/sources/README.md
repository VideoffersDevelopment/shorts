# Dokumenty Źródłowe (Sources)

Ten folder przechowuje dokumenty źródłowe dla projektów - PRD, opisy działania, prompty od klientów.

---

## 📁 Struktura

```
sources/
├── README.md                         # Ten plik
├── templates/                        # Szablony dokumentów
│   ├── prd-template.md               # Szablon PRD
│   ├── opis-template.md              # Szablon opisu działania
│   └── prompt-template.md            # Szablon dla surowego prompta
└── {PROJECT_NAME}/                   # Folder projektu
    ├── source-01-prd.md              # PRD projektu
    ├── source-02-opis.md             # Opis działania
    ├── source-03-prompt.md           # Surowy prompt (opcjonalnie)
    └── sources-index.json            # Metadane i status źródeł
```

---

## 🚀 Komendy

### `/aio-source-add <nazwa-projektu>`

Dodaje istniejący dokument źródłowy do projektu.

**Użycie:**

```
/aio-source-add "VideoShorts"
```

**AI zapyta o:**

1. Typ dokumentu (prd/opis/prompt/custom)
2. Ścieżkę do pliku LUB treść do wklejenia
3. Krótki opis dokumentu

**Wynik:**

- Kopiuje/tworzy plik w `sources/{PROJECT_NAME}/`
- Aktualizuje `sources-index.json`

---

### `/aio-source-create <nazwa-projektu>` [--type=prd|opis|prompt]

Tworzy nowy dokument źródłowy przez rozmowę z AI.

**Użycie:**

```
/aio-source-create "VideoShorts" --type=prd
```

**Tryby:**

| Typ      | Opis                           | Proces                                      |
| -------- | ------------------------------ | ------------------------------------------- |
| `prd`    | Product Requirements Document  | AI zadaje pytania o produkt, stack, funkcje |
| `opis`   | Opis działania dla klienta     | AI pyta o user flows, scenariusze           |
| `prompt` | Przetworzenie surowego prompta | Wklejasz tekst, AI strukturyzuje            |

**Wynik:**

- Tworzy ustrukturyzowany dokument w `sources/{PROJECT_NAME}/`
- Aktualizuje `sources-index.json`

---

### `/aio-project-from-sources <nazwa-projektu>`

Generuje specyfikację projektu na podstawie dokumentów źródłowych.

**Użycie:**

```
/aio-project-from-sources "VideoShorts"
```

**Proces:**

1. AI czyta wszystkie dokumenty z `sources/{PROJECT_NAME}/`
2. Analizuje i konsoliduje informacje
3. Generuje `projects/{PROJECT_NAME}/project-spec.md`
4. Proponuje podział na etapy
5. Tworzy `stages/` z poszczególnymi etapami

**Wynik:**

```
projects/{PROJECT_NAME}/
├── project-spec.md           # Wygenerowana specyfikacja
├── architecture-plan.md      # Plan architektury
├── sources-ref.json          # Referencje do źródeł
└── stages/
    ├── index.md
    ├── stage-01-{name}/
    │   └── spec.md
    └── ...
```

---

## 📋 Workflow

### Scenariusz A: Masz gotowe dokumenty

```
1. Masz PRD i/lub opis działania (np. od klienta)
   ↓
2. /aio-source-add "MójProjekt"
   → Dodajesz PRD
   → Dodajesz opis działania
   ↓
3. /aio-project-from-sources "MójProjekt"
   → AI generuje project-spec.md
   → AI dzieli na etapy
   ↓
4. Eksport do AI Spec Flow
   → /ai-brief z zawartością stage-01/spec.md
```

### Scenariusz B: Tworzysz od zera

```
1. Masz pomysł na projekt
   ↓
2. /aio-source-create "MójProjekt" --type=prd
   → AI zadaje pytania
   → Powstaje PRD
   ↓
3. (Opcjonalnie) /aio-source-create "MójProjekt" --type=opis
   → AI tworzy opis działania
   ↓
4. /aio-project-from-sources "MójProjekt"
   → AI generuje specyfikację
   ↓
5. Eksport do AI Spec Flow
```

### Scenariusz C: Masz surowy prompt

```
1. Klient przysłał długi opis w mailu/chacie
   ↓
2. /aio-source-create "MójProjekt" --type=prompt
   → Wklejasz tekst
   → AI strukturyzuje do PRD
   ↓
3. /aio-project-from-sources "MójProjekt"
   → AI generuje specyfikację
```

---

## 📝 Format sources-index.json

```json
{
	"project": "VideoShorts",
	"created": "2025-11-28",
	"updated": "2025-11-28",
	"sources": [
		{
			"id": "source-01",
			"type": "prd",
			"file": "source-01-prd.md",
			"title": "PRD i Specyfikacja Techniczna",
			"description": "Pełna specyfikacja techniczna z stackiem SaaS",
			"added": "2025-11-28",
			"status": "active"
		},
		{
			"id": "source-02",
			"type": "opis",
			"file": "source-02-opis.md",
			"title": "Opis Działania Aplikacji",
			"description": "Dokument dla klienta z user flows",
			"added": "2025-11-28",
			"status": "active"
		}
	],
	"generated": {
		"project_spec": false,
		"architecture_plan": false,
		"stages": false
	}
}
```

---

## 🔗 Integracja z Istniejącymi Dokumentami

Jeśli masz już dokumenty w `.ai-prompts/`:

```
/aio-source-add "VideoShorts"

AI: Jaki typ dokumentu chcesz dodać?
> prd

AI: Podaj ścieżkę do pliku lub wklej treść:
> .ai-prompts/PRD_Specyfikacja_VideoShorts_SaaS.md

AI: Krótki opis dokumentu:
> Pełna specyfikacja techniczna z stackiem SaaS

✅ Dodano source-01-prd.md do sources/VideoShorts/
```

---

## ⚠️ Ważne Zasady

1. **Źródła są read-only** - po dodaniu nie modyfikuj ich bezpośrednio
2. **Jeden projekt = jeden folder** - wszystkie źródła projektu w jednym miejscu
3. **Metadane w JSON** - `sources-index.json` śledzi status
4. **Generowanie jest idempotentne** - możesz regenerować specyfikację wielokrotnie
5. **Źródła mogą się uzupełniać** - PRD + opis + prompt = pełniejszy obraz

---

## 📚 Typy Dokumentów

### PRD (Product Requirements Document)

Zawiera:

- Specyfikację techniczną
- Stack technologiczny
- Wymagania funkcjonalne
- Model biznesowy
- Plan wdrożenia

### Opis Działania

Zawiera:

- User flows
- Scenariusze użycia
- Mockupy tekstowe
- FAQ
- Opis dla klienta

### Prompt

Zawiera:

- Surowy tekst od klienta
- Notatki ze spotkań
- Wymagania w formie swobodnej

AI przetwarza prompt do ustrukturyzowanej formy.

---

## Historia Zmian

| Data       | Opis                       |
| ---------- | -------------------------- |
| 2025-11-28 | Utworzenie systemu sources |
