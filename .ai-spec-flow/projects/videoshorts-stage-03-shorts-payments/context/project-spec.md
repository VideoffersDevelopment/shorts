# Context: Project Specification

> **SOURCE:** `.ai-project-planner/projects/videoshorts/project-spec.md`
> **Import:** 2025-12-31
> **Status:** Reference

---

Ten plik jest referencją do pełnej specyfikacji projektu VideoShorts.

**Pełna specyfikacja znajduje się w:**
`.ai-project-planner/projects/videoshorts/project-spec.md`

## Quick Reference

### Projekt
- **Nazwa:** VideoShorts
- **Model:** Pay-per-video SaaS
- **Płatności:** Multi-provider (Przelewy24, Tpay)

### Typy Użytkowników
1. **User** - przeglądający, komentujący
2. **Company** - firmy publikujące shorty
3. **Admin** - moderacja, zarządzanie

### Główne Moduły
1. Authentication & Users (Etap 1)
2. Companies (Etap 2)
3. **Shorts + Payments (Etap 3)** ← CURRENT
4. Feed & Discovery (Etap 4)
5. Interactions (Etap 5)
6. Moderation (Etap 6)
7. Analytics (Etap 7)
8. Notifications (Etap 8)

### Video Pipeline
- **Upload:** Direct do Cloudflare R2 (video-raw bucket)
- **Transcode:** Qencode (HLS 1080p/720p/480p)
- **Storage:** Cloudflare R2 (video-hls bucket)
- **Player:** @vidstack/react

### Integracje
- Cloudflare R2 (storage)
- Qencode (transcoding)
- Przelewy24, Tpay (payments)
- Mapbox (geolocation)
- Resend (email)
- Inngest (background jobs)
- PostHog (analytics)
