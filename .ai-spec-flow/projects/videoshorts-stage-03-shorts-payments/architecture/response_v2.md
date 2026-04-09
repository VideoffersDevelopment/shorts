# Architecture Addendum v2: Missing Translations

**Project:** videoshorts-stage-03-shorts-payments
**Date:** 2025-12-31
**Iteration:** v2

> **Reference:** See `response_v1.md` for complete architecture
> **This document:** Adds missing translation files for DE, ES, RU, UK locales

---

## German (DE) Translations

### src/lib/locales/de/shorts.json

```json
{
  "meta": {
    "title": "Meine Shorts",
    "description": "Verwalten Sie Ihre Video-Shorts"
  },
  "list": {
    "title": "Meine Shorts",
    "empty": "Sie haben noch keine Shorts erstellt",
    "emptyDescription": "Erstellen Sie Ihren ersten Short, um Kunden zu erreichen",
    "createFirst": "Ersten Short erstellen"
  },
  "create": {
    "title": "Neuen Short erstellen",
    "steps": {
      "video": "Video",
      "metadata": "Details",
      "thumbnail": "Vorschaubild",
      "review": "Überprüfung"
    }
  },
  "wizard": {
    "video": {
      "title": "Video hochladen",
      "description": "Ziehen Sie Ihr Video hierher oder klicken Sie zum Durchsuchen",
      "requirements": "MP4, MOV oder WebM. Max. 60 Sekunden, max. 100MB.",
      "aspectRatioWarning": "Das Video ist nicht im Format 9:16. Es wird möglicherweise nicht optimal angezeigt.",
      "uploading": "Wird hochgeladen...",
      "uploadComplete": "Hochladen abgeschlossen",
      "uploadFailed": "Hochladen fehlgeschlagen",
      "invalidFormat": "Ungültiges Dateiformat. Verwenden Sie MP4, MOV oder WebM.",
      "fileTooLarge": "Die Datei ist zu groß. Maximale Größe ist 100MB.",
      "durationTooLong": "Das Video ist zu lang. Maximale Dauer ist 60 Sekunden."
    },
    "metadata": {
      "title": "Short-Details",
      "titleField": "Titel",
      "titlePlaceholder": "Geben Sie einen eingängigen Titel ein",
      "titleHint": "Maximal 100 Zeichen",
      "description": "Beschreibung",
      "descriptionPlaceholder": "Beschreiben Sie Ihren Short...",
      "descriptionHint": "Maximal 500 Zeichen (optional)",
      "category": "Kategorie",
      "categoryPlaceholder": "Wählen Sie eine Kategorie",
      "tags": "Tags",
      "tagsPlaceholder": "Fügen Sie bis zu 10 Tags hinzu",
      "tagsHint": "Drücken Sie Enter, um ein Tag hinzuzufügen",
      "location": "Standort",
      "locationPlaceholder": "Standort suchen",
      "locationHint": "Standardmäßig Ihr Unternehmensstandort",
      "ctaLink": "Call-to-Action-Link",
      "ctaLinkPlaceholder": "https://beispiel.de/ihr-angebot",
      "ctaLinkHint": "Optionaler Link, der mit Ihrem Short angezeigt wird"
    },
    "thumbnail": {
      "title": "Vorschaubild",
      "description": "Wählen Sie ein Vorschaubild für Ihren Short",
      "auto": "Automatisch generiert",
      "autoDescription": "Wir extrahieren ein Bild aus Ihrem Video",
      "custom": "Eigenes hochladen",
      "customDescription": "Laden Sie Ihr eigenes Bild hoch (1080x1920, max. 2MB)",
      "requirements": "JPEG oder PNG. Seitenverhältnis 9:16 empfohlen."
    },
    "review": {
      "title": "Überprüfen Sie Ihren Short",
      "description": "Prüfen Sie alles vor dem Speichern",
      "videoPreview": "Videovorschau",
      "details": "Details",
      "thumbnailPreview": "Vorschaubildvorschau",
      "edit": "Bearbeiten"
    },
    "actions": {
      "next": "Weiter",
      "back": "Zurück",
      "saveDraft": "Als Entwurf speichern",
      "saving": "Wird gespeichert...",
      "cancel": "Abbrechen"
    }
  },
  "detail": {
    "status": "Status",
    "createdAt": "Erstellt",
    "publishedAt": "Veröffentlicht",
    "expiresAt": "Läuft ab",
    "views": "Aufrufe",
    "likes": "Gefällt mir",
    "duration": "Dauer",
    "category": "Kategorie",
    "tags": "Tags",
    "location": "Standort",
    "ctaLink": "CTA-Link"
  },
  "status": {
    "DRAFT": "Entwurf",
    "PENDING_PAYMENT": "Zahlung ausstehend",
    "PROCESSING": "Wird verarbeitet",
    "PUBLISHED": "Veröffentlicht",
    "ARCHIVED": "Archiviert",
    "DELETED": "Gelöscht"
  },
  "actions": {
    "view": "Ansehen",
    "edit": "Bearbeiten",
    "publish": "Veröffentlichen",
    "archive": "Archivieren",
    "duplicate": "Duplizieren",
    "delete": "Löschen",
    "renew": "Erneuern"
  },
  "publish": {
    "title": "Short veröffentlichen",
    "description": "Ihr Short wird 30 Tage lang sichtbar sein",
    "cost": "Veröffentlichungskosten",
    "credits": "Ihre Guthaben",
    "useCredits": "Guthaben verwenden",
    "payNow": "{price} PLN zahlen",
    "noCredits": "Sie haben keine Guthaben. Kaufen Sie unten oder zahlen Sie pro Short.",
    "processing": "Wird veröffentlicht..."
  },
  "publishing": {
    "title": "Ihr Short wird veröffentlicht",
    "description": "Bitte warten Sie, während wir Ihr Video verarbeiten",
    "steps": {
      "draft": "Entwurf erstellt",
      "payment": "Zahlung erhalten",
      "processing": "Video wird verarbeitet...",
      "publishing": "Veröffentlichung steht bevor"
    },
    "estimatedTime": "Dauert normalerweise 2-5 Minuten",
    "success": "Ihr Short ist live!",
    "viewShort": "Short ansehen",
    "error": "Verarbeitung fehlgeschlagen",
    "retry": "Erneut versuchen",
    "refund": "Rückerstattung anfordern"
  },
  "archive": {
    "title": "Short archivieren",
    "description": "Dieser Short wird aus dem Feed entfernt, bleibt aber über einen direkten Link zugänglich.",
    "confirm": "Ja, archivieren"
  },
  "delete": {
    "title": "Entwurf löschen",
    "description": "Diese Aktion kann nicht rückgängig gemacht werden. Der Entwurf wird dauerhaft gelöscht.",
    "confirm": "Ja, löschen"
  },
  "renew": {
    "title": "Short erneuern",
    "description": "Sichtbarkeit um weitere 30 Tage verlängern",
    "cost": "Erneuerungskosten",
    "renewNow": "Für {price} PLN erneuern"
  },
  "public": {
    "company": "Von",
    "viewProfile": "Profil ansehen",
    "visitWebsite": "Webseite besuchen",
    "share": "Teilen",
    "report": "Melden"
  },
  "table": {
    "thumbnail": "Vorschaubild",
    "title": "Titel",
    "status": "Status",
    "views": "Aufrufe",
    "created": "Erstellt",
    "expires": "Läuft ab",
    "actions": "Aktionen"
  },
  "filters": {
    "all": "Alle",
    "drafts": "Entwürfe",
    "published": "Veröffentlicht",
    "archived": "Archiviert",
    "search": "Shorts suchen..."
  },
  "errors": {
    "notFound": "Short nicht gefunden",
    "unauthorized": "Sie haben keinen Zugriff auf diesen Short",
    "maxDrafts": "Maximale Anzahl an Entwürfen erreicht (10)",
    "uploadFailed": "Video konnte nicht hochgeladen werden",
    "createFailed": "Short konnte nicht erstellt werden",
    "updateFailed": "Short konnte nicht aktualisiert werden",
    "deleteFailed": "Short konnte nicht gelöscht werden",
    "publishFailed": "Short konnte nicht veröffentlicht werden",
    "notVerified": "Ihr Unternehmen muss verifiziert sein, um Shorts zu veröffentlichen",
    "insufficientCredits": "Nicht genügend Guthaben"
  },
  "success": {
    "created": "Entwurf erfolgreich gespeichert",
    "updated": "Short erfolgreich aktualisiert",
    "deleted": "Short erfolgreich gelöscht",
    "archived": "Short erfolgreich archiviert",
    "published": "Short erfolgreich veröffentlicht",
    "renewed": "Short erfolgreich erneuert"
  }
}
```

### src/lib/locales/de/payments.json

```json
{
  "meta": {
    "title": "Zahlungen",
    "description": "Verwalten Sie Ihre Zahlungen und Guthaben"
  },
  "credits": {
    "title": "Veröffentlichungsguthaben",
    "balance": "Ihr Kontostand",
    "creditsAvailable": "{count} Guthaben verfügbar",
    "history": "Transaktionsverlauf",
    "noHistory": "Noch keine Transaktionen",
    "purchase": "Guthaben kaufen",
    "packages": {
      "title": "Guthabenpakete",
      "single": "Einzelne Veröffentlichung",
      "singleDescription": "1 Guthaben für einen Short",
      "starter": "Starterpaket",
      "starterDescription": "5 Guthaben - 10% sparen",
      "business": "Businesspaket",
      "businessDescription": "20 Guthaben - 20% sparen",
      "enterprise": "Enterprise-Paket",
      "enterpriseDescription": "50 Guthaben - 30% sparen"
    }
  },
  "checkout": {
    "title": "Zahlung abschließen",
    "summary": "Bestellübersicht",
    "item": "Veröffentlichungsguthaben",
    "items": "Veröffentlichungsguthaben",
    "subtotal": "Zwischensumme",
    "vat": "MwSt. (23%)",
    "total": "Gesamt",
    "payWith": "Bezahlen mit",
    "processing": "Zahlung wird verarbeitet...",
    "redirect": "Weiterleitung zum Zahlungsanbieter..."
  },
  "providers": {
    "przelewy24": "Przelewy24",
    "przelewy24Description": "BLIK, Banküberweisung, Karten, Google Pay",
    "tpay": "Tpay",
    "tpayDescription": "BLIK, Banküberweisung, Karten, Apple Pay"
  },
  "methods": {
    "blik": "BLIK",
    "bankTransfer": "Banküberweisung",
    "card": "Kredit-/Debitkarte",
    "googlePay": "Google Pay",
    "applePay": "Apple Pay"
  },
  "status": {
    "PENDING": "Ausstehend",
    "SUCCEEDED": "Abgeschlossen",
    "FAILED": "Fehlgeschlagen",
    "REFUNDED": "Erstattet"
  },
  "source": {
    "PACKAGE": "Paketkauf",
    "GIFT": "Geschenk",
    "PROMO": "Werbung",
    "REFUND": "Rückerstattung",
    "ADMIN": "Admin-Zuweisung",
    "PUBLICATION": "Veröffentlichung",
    "OTHER": "Sonstiges"
  },
  "transaction": {
    "date": "Datum",
    "type": "Typ",
    "amount": "Betrag",
    "balance": "Saldo danach",
    "shortLink": "Zugehöriger Short"
  },
  "success": {
    "title": "Zahlung erfolgreich!",
    "description": "Ihre Guthaben wurden Ihrem Konto gutgeschrieben.",
    "creditsAdded": "{count} Guthaben hinzugefügt",
    "viewCredits": "Guthaben ansehen",
    "continueShopping": "Short erstellen"
  },
  "cancel": {
    "title": "Zahlung abgebrochen",
    "description": "Ihre Zahlung wurde nicht abgeschlossen.",
    "tryAgain": "Erneut versuchen",
    "backToShorts": "Zurück zu Shorts"
  },
  "errors": {
    "paymentFailed": "Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    "invalidAmount": "Ungültiger Zahlungsbetrag",
    "providerError": "Fehler beim Zahlungsanbieter. Bitte versuchen Sie eine andere Methode.",
    "sessionExpired": "Zahlungssitzung abgelaufen. Bitte beginnen Sie erneut."
  },
  "invoice": {
    "title": "Rechnung",
    "download": "Rechnung herunterladen",
    "generating": "Rechnung wird erstellt..."
  }
}
```

---

## Spanish (ES) Translations

### src/lib/locales/es/shorts.json

```json
{
  "meta": {
    "title": "Mis Shorts",
    "description": "Gestiona tus video shorts"
  },
  "list": {
    "title": "Mis Shorts",
    "empty": "Aún no has creado ningún short",
    "emptyDescription": "Crea tu primer short para llegar a los clientes",
    "createFirst": "Crear tu primer Short"
  },
  "create": {
    "title": "Crear nuevo Short",
    "steps": {
      "video": "Video",
      "metadata": "Detalles",
      "thumbnail": "Miniatura",
      "review": "Revisión"
    }
  },
  "wizard": {
    "video": {
      "title": "Subir video",
      "description": "Arrastra y suelta tu video o haz clic para explorar",
      "requirements": "MP4, MOV o WebM. Máx. 60 segundos, máx. 100MB.",
      "aspectRatioWarning": "El video no está en formato 9:16. Puede que no se muestre de forma óptima.",
      "uploading": "Subiendo...",
      "uploadComplete": "Subida completada",
      "uploadFailed": "Error en la subida",
      "invalidFormat": "Formato de archivo no válido. Usa MP4, MOV o WebM.",
      "fileTooLarge": "El archivo es demasiado grande. Tamaño máximo es 100MB.",
      "durationTooLong": "El video es demasiado largo. Duración máxima es 60 segundos."
    },
    "metadata": {
      "title": "Detalles del Short",
      "titleField": "Título",
      "titlePlaceholder": "Introduce un título llamativo",
      "titleHint": "Máximo 100 caracteres",
      "description": "Descripción",
      "descriptionPlaceholder": "Describe tu short...",
      "descriptionHint": "Máximo 500 caracteres (opcional)",
      "category": "Categoría",
      "categoryPlaceholder": "Selecciona una categoría",
      "tags": "Etiquetas",
      "tagsPlaceholder": "Añade hasta 10 etiquetas",
      "tagsHint": "Pulsa Enter para añadir una etiqueta",
      "location": "Ubicación",
      "locationPlaceholder": "Buscar ubicación",
      "locationHint": "Por defecto, la ubicación de tu empresa",
      "ctaLink": "Enlace de llamada a la acción",
      "ctaLinkPlaceholder": "https://ejemplo.com/tu-oferta",
      "ctaLinkHint": "Enlace opcional mostrado con tu short"
    },
    "thumbnail": {
      "title": "Miniatura",
      "description": "Elige una miniatura para tu short",
      "auto": "Generada automáticamente",
      "autoDescription": "Extraeremos un fotograma de tu video",
      "custom": "Subir personalizada",
      "customDescription": "Sube tu propia imagen (1080x1920, máx. 2MB)",
      "requirements": "JPEG o PNG. Se recomienda relación de aspecto 9:16."
    },
    "review": {
      "title": "Revisa tu Short",
      "description": "Comprueba todo antes de guardar",
      "videoPreview": "Vista previa del video",
      "details": "Detalles",
      "thumbnailPreview": "Vista previa de miniatura",
      "edit": "Editar"
    },
    "actions": {
      "next": "Siguiente",
      "back": "Atrás",
      "saveDraft": "Guardar como borrador",
      "saving": "Guardando...",
      "cancel": "Cancelar"
    }
  },
  "detail": {
    "status": "Estado",
    "createdAt": "Creado",
    "publishedAt": "Publicado",
    "expiresAt": "Expira",
    "views": "Vistas",
    "likes": "Me gusta",
    "duration": "Duración",
    "category": "Categoría",
    "tags": "Etiquetas",
    "location": "Ubicación",
    "ctaLink": "Enlace CTA"
  },
  "status": {
    "DRAFT": "Borrador",
    "PENDING_PAYMENT": "Pago pendiente",
    "PROCESSING": "Procesando",
    "PUBLISHED": "Publicado",
    "ARCHIVED": "Archivado",
    "DELETED": "Eliminado"
  },
  "actions": {
    "view": "Ver",
    "edit": "Editar",
    "publish": "Publicar",
    "archive": "Archivar",
    "duplicate": "Duplicar",
    "delete": "Eliminar",
    "renew": "Renovar"
  },
  "publish": {
    "title": "Publicar Short",
    "description": "Tu short será visible durante 30 días",
    "cost": "Coste de publicación",
    "credits": "Tus créditos",
    "useCredits": "Usar créditos",
    "payNow": "Pagar {price} PLN",
    "noCredits": "No tienes créditos. Compra abajo o paga por short.",
    "processing": "Publicando..."
  },
  "publishing": {
    "title": "Publicando tu Short",
    "description": "Por favor espera mientras procesamos tu video",
    "steps": {
      "draft": "Borrador creado",
      "payment": "Pago recibido",
      "processing": "Procesando video...",
      "publishing": "Publicación próxima"
    },
    "estimatedTime": "Normalmente tarda 2-5 minutos",
    "success": "¡Tu short está en línea!",
    "viewShort": "Ver Short",
    "error": "Procesamiento fallido",
    "retry": "Reintentar",
    "refund": "Solicitar reembolso"
  },
  "archive": {
    "title": "Archivar Short",
    "description": "Este short se eliminará del feed pero seguirá accesible mediante enlace directo.",
    "confirm": "Sí, archivar"
  },
  "delete": {
    "title": "Eliminar borrador",
    "description": "Esta acción no se puede deshacer. El borrador se eliminará permanentemente.",
    "confirm": "Sí, eliminar"
  },
  "renew": {
    "title": "Renovar Short",
    "description": "Extender visibilidad otros 30 días",
    "cost": "Coste de renovación",
    "renewNow": "Renovar por {price} PLN"
  },
  "public": {
    "company": "Por",
    "viewProfile": "Ver perfil",
    "visitWebsite": "Visitar sitio web",
    "share": "Compartir",
    "report": "Reportar"
  },
  "table": {
    "thumbnail": "Miniatura",
    "title": "Título",
    "status": "Estado",
    "views": "Vistas",
    "created": "Creado",
    "expires": "Expira",
    "actions": "Acciones"
  },
  "filters": {
    "all": "Todos",
    "drafts": "Borradores",
    "published": "Publicados",
    "archived": "Archivados",
    "search": "Buscar shorts..."
  },
  "errors": {
    "notFound": "Short no encontrado",
    "unauthorized": "No tienes acceso a este short",
    "maxDrafts": "Número máximo de borradores alcanzado (10)",
    "uploadFailed": "Error al subir el video",
    "createFailed": "Error al crear el short",
    "updateFailed": "Error al actualizar el short",
    "deleteFailed": "Error al eliminar el short",
    "publishFailed": "Error al publicar el short",
    "notVerified": "Tu empresa debe estar verificada para publicar shorts",
    "insufficientCredits": "Créditos insuficientes"
  },
  "success": {
    "created": "Borrador guardado correctamente",
    "updated": "Short actualizado correctamente",
    "deleted": "Short eliminado correctamente",
    "archived": "Short archivado correctamente",
    "published": "Short publicado correctamente",
    "renewed": "Short renovado correctamente"
  }
}
```

### src/lib/locales/es/payments.json

```json
{
  "meta": {
    "title": "Pagos",
    "description": "Gestiona tus pagos y créditos"
  },
  "credits": {
    "title": "Créditos de publicación",
    "balance": "Tu saldo",
    "creditsAvailable": "{count} créditos disponibles",
    "history": "Historial de transacciones",
    "noHistory": "Sin transacciones aún",
    "purchase": "Comprar créditos",
    "packages": {
      "title": "Paquetes de créditos",
      "single": "Publicación única",
      "singleDescription": "1 crédito para un short",
      "starter": "Paquete inicial",
      "starterDescription": "5 créditos - ahorra 10%",
      "business": "Paquete empresarial",
      "businessDescription": "20 créditos - ahorra 20%",
      "enterprise": "Paquete Enterprise",
      "enterpriseDescription": "50 créditos - ahorra 30%"
    }
  },
  "checkout": {
    "title": "Completar pago",
    "summary": "Resumen del pedido",
    "item": "Crédito de publicación",
    "items": "Créditos de publicación",
    "subtotal": "Subtotal",
    "vat": "IVA (23%)",
    "total": "Total",
    "payWith": "Pagar con",
    "processing": "Procesando pago...",
    "redirect": "Redirigiendo al proveedor de pago..."
  },
  "providers": {
    "przelewy24": "Przelewy24",
    "przelewy24Description": "BLIK, transferencia bancaria, tarjetas, Google Pay",
    "tpay": "Tpay",
    "tpayDescription": "BLIK, transferencia bancaria, tarjetas, Apple Pay"
  },
  "methods": {
    "blik": "BLIK",
    "bankTransfer": "Transferencia bancaria",
    "card": "Tarjeta de crédito/débito",
    "googlePay": "Google Pay",
    "applePay": "Apple Pay"
  },
  "status": {
    "PENDING": "Pendiente",
    "SUCCEEDED": "Completado",
    "FAILED": "Fallido",
    "REFUNDED": "Reembolsado"
  },
  "source": {
    "PACKAGE": "Compra de paquete",
    "GIFT": "Regalo",
    "PROMO": "Promocional",
    "REFUND": "Reembolso",
    "ADMIN": "Asignación de administrador",
    "PUBLICATION": "Publicación",
    "OTHER": "Otro"
  },
  "transaction": {
    "date": "Fecha",
    "type": "Tipo",
    "amount": "Cantidad",
    "balance": "Saldo después",
    "shortLink": "Short relacionado"
  },
  "success": {
    "title": "¡Pago exitoso!",
    "description": "Tus créditos han sido añadidos a tu cuenta.",
    "creditsAdded": "{count} créditos añadidos",
    "viewCredits": "Ver créditos",
    "continueShopping": "Crear un Short"
  },
  "cancel": {
    "title": "Pago cancelado",
    "description": "Tu pago no se ha completado.",
    "tryAgain": "Intentar de nuevo",
    "backToShorts": "Volver a Shorts"
  },
  "errors": {
    "paymentFailed": "Pago fallido. Por favor, inténtalo de nuevo.",
    "invalidAmount": "Cantidad de pago no válida",
    "providerError": "Error del proveedor de pago. Por favor, prueba otro método.",
    "sessionExpired": "Sesión de pago expirada. Por favor, empieza de nuevo."
  },
  "invoice": {
    "title": "Factura",
    "download": "Descargar factura",
    "generating": "Generando factura..."
  }
}
```

---

## Russian (RU) Translations

### src/lib/locales/ru/shorts.json

```json
{
  "meta": {
    "title": "Мои Shorts",
    "description": "Управляйте своими видео shorts"
  },
  "list": {
    "title": "Мои Shorts",
    "empty": "Вы ещё не создали ни одного short",
    "emptyDescription": "Создайте свой первый short, чтобы привлечь клиентов",
    "createFirst": "Создать первый Short"
  },
  "create": {
    "title": "Создать новый Short",
    "steps": {
      "video": "Видео",
      "metadata": "Детали",
      "thumbnail": "Превью",
      "review": "Проверка"
    }
  },
  "wizard": {
    "video": {
      "title": "Загрузить видео",
      "description": "Перетащите видео сюда или нажмите для выбора",
      "requirements": "MP4, MOV или WebM. Макс. 60 секунд, макс. 100МБ.",
      "aspectRatioWarning": "Видео не в формате 9:16. Оно может отображаться неоптимально.",
      "uploading": "Загрузка...",
      "uploadComplete": "Загрузка завершена",
      "uploadFailed": "Ошибка загрузки",
      "invalidFormat": "Неверный формат файла. Используйте MP4, MOV или WebM.",
      "fileTooLarge": "Файл слишком большой. Максимальный размер — 100МБ.",
      "durationTooLong": "Видео слишком длинное. Максимальная длительность — 60 секунд."
    },
    "metadata": {
      "title": "Детали Short",
      "titleField": "Название",
      "titlePlaceholder": "Введите привлекательное название",
      "titleHint": "Максимум 100 символов",
      "description": "Описание",
      "descriptionPlaceholder": "Опишите ваш short...",
      "descriptionHint": "Максимум 500 символов (необязательно)",
      "category": "Категория",
      "categoryPlaceholder": "Выберите категорию",
      "tags": "Теги",
      "tagsPlaceholder": "Добавьте до 10 тегов",
      "tagsHint": "Нажмите Enter для добавления тега",
      "location": "Местоположение",
      "locationPlaceholder": "Поиск местоположения",
      "locationHint": "По умолчанию — местоположение вашей компании",
      "ctaLink": "Ссылка призыва к действию",
      "ctaLinkPlaceholder": "https://example.com/ваше-предложение",
      "ctaLinkHint": "Необязательная ссылка, отображаемая с вашим short"
    },
    "thumbnail": {
      "title": "Превью",
      "description": "Выберите превью для вашего short",
      "auto": "Автоматически",
      "autoDescription": "Мы извлечём кадр из вашего видео",
      "custom": "Загрузить своё",
      "customDescription": "Загрузите своё изображение (1080x1920, макс. 2МБ)",
      "requirements": "JPEG или PNG. Рекомендуется соотношение сторон 9:16."
    },
    "review": {
      "title": "Проверьте ваш Short",
      "description": "Проверьте всё перед сохранением",
      "videoPreview": "Предпросмотр видео",
      "details": "Детали",
      "thumbnailPreview": "Предпросмотр превью",
      "edit": "Редактировать"
    },
    "actions": {
      "next": "Далее",
      "back": "Назад",
      "saveDraft": "Сохранить как черновик",
      "saving": "Сохранение...",
      "cancel": "Отмена"
    }
  },
  "detail": {
    "status": "Статус",
    "createdAt": "Создано",
    "publishedAt": "Опубликовано",
    "expiresAt": "Истекает",
    "views": "Просмотры",
    "likes": "Лайки",
    "duration": "Длительность",
    "category": "Категория",
    "tags": "Теги",
    "location": "Местоположение",
    "ctaLink": "CTA-ссылка"
  },
  "status": {
    "DRAFT": "Черновик",
    "PENDING_PAYMENT": "Ожидает оплаты",
    "PROCESSING": "Обработка",
    "PUBLISHED": "Опубликовано",
    "ARCHIVED": "В архиве",
    "DELETED": "Удалено"
  },
  "actions": {
    "view": "Смотреть",
    "edit": "Редактировать",
    "publish": "Опубликовать",
    "archive": "Архивировать",
    "duplicate": "Дублировать",
    "delete": "Удалить",
    "renew": "Продлить"
  },
  "publish": {
    "title": "Опубликовать Short",
    "description": "Ваш short будет виден в течение 30 дней",
    "cost": "Стоимость публикации",
    "credits": "Ваши кредиты",
    "useCredits": "Использовать кредиты",
    "payNow": "Оплатить {price} PLN",
    "noCredits": "У вас нет кредитов. Купите ниже или оплатите за отдельный short.",
    "processing": "Публикация..."
  },
  "publishing": {
    "title": "Публикация вашего Short",
    "description": "Пожалуйста, подождите, пока мы обрабатываем ваше видео",
    "steps": {
      "draft": "Черновик создан",
      "payment": "Оплата получена",
      "processing": "Обработка видео...",
      "publishing": "Скоро публикация"
    },
    "estimatedTime": "Обычно занимает 2-5 минут",
    "success": "Ваш short опубликован!",
    "viewShort": "Смотреть Short",
    "error": "Ошибка обработки",
    "retry": "Повторить",
    "refund": "Запросить возврат"
  },
  "archive": {
    "title": "Архивировать Short",
    "description": "Этот short будет удалён из ленты, но останется доступным по прямой ссылке.",
    "confirm": "Да, архивировать"
  },
  "delete": {
    "title": "Удалить черновик",
    "description": "Это действие нельзя отменить. Черновик будет удалён навсегда.",
    "confirm": "Да, удалить"
  },
  "renew": {
    "title": "Продлить Short",
    "description": "Продлить видимость ещё на 30 дней",
    "cost": "Стоимость продления",
    "renewNow": "Продлить за {price} PLN"
  },
  "public": {
    "company": "От",
    "viewProfile": "Смотреть профиль",
    "visitWebsite": "Посетить сайт",
    "share": "Поделиться",
    "report": "Пожаловаться"
  },
  "table": {
    "thumbnail": "Превью",
    "title": "Название",
    "status": "Статус",
    "views": "Просмотры",
    "created": "Создано",
    "expires": "Истекает",
    "actions": "Действия"
  },
  "filters": {
    "all": "Все",
    "drafts": "Черновики",
    "published": "Опубликованные",
    "archived": "В архиве",
    "search": "Поиск shorts..."
  },
  "errors": {
    "notFound": "Short не найден",
    "unauthorized": "У вас нет доступа к этому short",
    "maxDrafts": "Достигнуто максимальное количество черновиков (10)",
    "uploadFailed": "Не удалось загрузить видео",
    "createFailed": "Не удалось создать short",
    "updateFailed": "Не удалось обновить short",
    "deleteFailed": "Не удалось удалить short",
    "publishFailed": "Не удалось опубликовать short",
    "notVerified": "Ваша компания должна быть верифицирована для публикации shorts",
    "insufficientCredits": "Недостаточно кредитов"
  },
  "success": {
    "created": "Черновик успешно сохранён",
    "updated": "Short успешно обновлён",
    "deleted": "Short успешно удалён",
    "archived": "Short успешно архивирован",
    "published": "Short успешно опубликован",
    "renewed": "Short успешно продлён"
  }
}
```

### src/lib/locales/ru/payments.json

```json
{
  "meta": {
    "title": "Платежи",
    "description": "Управляйте платежами и кредитами"
  },
  "credits": {
    "title": "Кредиты публикации",
    "balance": "Ваш баланс",
    "creditsAvailable": "{count} кредитов доступно",
    "history": "История транзакций",
    "noHistory": "Транзакций пока нет",
    "purchase": "Купить кредиты",
    "packages": {
      "title": "Пакеты кредитов",
      "single": "Одна публикация",
      "singleDescription": "1 кредит на один short",
      "starter": "Стартовый пакет",
      "starterDescription": "5 кредитов — экономия 10%",
      "business": "Бизнес-пакет",
      "businessDescription": "20 кредитов — экономия 20%",
      "enterprise": "Enterprise-пакет",
      "enterpriseDescription": "50 кредитов — экономия 30%"
    }
  },
  "checkout": {
    "title": "Завершить оплату",
    "summary": "Итого заказа",
    "item": "Кредит публикации",
    "items": "Кредиты публикации",
    "subtotal": "Промежуточный итог",
    "vat": "НДС (23%)",
    "total": "Итого",
    "payWith": "Оплатить через",
    "processing": "Обработка платежа...",
    "redirect": "Перенаправление к платёжному провайдеру..."
  },
  "providers": {
    "przelewy24": "Przelewy24",
    "przelewy24Description": "BLIK, банковский перевод, карты, Google Pay",
    "tpay": "Tpay",
    "tpayDescription": "BLIK, банковский перевод, карты, Apple Pay"
  },
  "methods": {
    "blik": "BLIK",
    "bankTransfer": "Банковский перевод",
    "card": "Кредитная/дебетовая карта",
    "googlePay": "Google Pay",
    "applePay": "Apple Pay"
  },
  "status": {
    "PENDING": "Ожидание",
    "SUCCEEDED": "Завершено",
    "FAILED": "Ошибка",
    "REFUNDED": "Возвращено"
  },
  "source": {
    "PACKAGE": "Покупка пакета",
    "GIFT": "Подарок",
    "PROMO": "Промо-акция",
    "REFUND": "Возврат",
    "ADMIN": "Начислено администратором",
    "PUBLICATION": "Публикация",
    "OTHER": "Другое"
  },
  "transaction": {
    "date": "Дата",
    "type": "Тип",
    "amount": "Сумма",
    "balance": "Баланс после",
    "shortLink": "Связанный Short"
  },
  "success": {
    "title": "Оплата успешна!",
    "description": "Ваши кредиты добавлены на счёт.",
    "creditsAdded": "Добавлено {count} кредитов",
    "viewCredits": "Посмотреть кредиты",
    "continueShopping": "Создать Short"
  },
  "cancel": {
    "title": "Оплата отменена",
    "description": "Ваш платёж не был завершён.",
    "tryAgain": "Попробовать снова",
    "backToShorts": "Вернуться к Shorts"
  },
  "errors": {
    "paymentFailed": "Ошибка оплаты. Пожалуйста, попробуйте снова.",
    "invalidAmount": "Неверная сумма платежа",
    "providerError": "Ошибка платёжного провайдера. Попробуйте другой способ.",
    "sessionExpired": "Сессия платежа истекла. Начните заново."
  },
  "invoice": {
    "title": "Счёт",
    "download": "Скачать счёт",
    "generating": "Формирование счёта..."
  }
}
```

---

## Ukrainian (UK) Translations

### src/lib/locales/uk/shorts.json

```json
{
  "meta": {
    "title": "Мої Shorts",
    "description": "Керуйте своїми відео shorts"
  },
  "list": {
    "title": "Мої Shorts",
    "empty": "Ви ще не створили жодного short",
    "emptyDescription": "Створіть свій перший short, щоб залучити клієнтів",
    "createFirst": "Створити перший Short"
  },
  "create": {
    "title": "Створити новий Short",
    "steps": {
      "video": "Відео",
      "metadata": "Деталі",
      "thumbnail": "Мініатюра",
      "review": "Перевірка"
    }
  },
  "wizard": {
    "video": {
      "title": "Завантажити відео",
      "description": "Перетягніть відео сюди або натисніть для вибору",
      "requirements": "MP4, MOV або WebM. Макс. 60 секунд, макс. 100МБ.",
      "aspectRatioWarning": "Відео не у форматі 9:16. Воно може відображатися неоптимально.",
      "uploading": "Завантаження...",
      "uploadComplete": "Завантаження завершено",
      "uploadFailed": "Помилка завантаження",
      "invalidFormat": "Невірний формат файлу. Використовуйте MP4, MOV або WebM.",
      "fileTooLarge": "Файл занадто великий. Максимальний розмір — 100МБ.",
      "durationTooLong": "Відео занадто довге. Максимальна тривалість — 60 секунд."
    },
    "metadata": {
      "title": "Деталі Short",
      "titleField": "Назва",
      "titlePlaceholder": "Введіть привабливу назву",
      "titleHint": "Максимум 100 символів",
      "description": "Опис",
      "descriptionPlaceholder": "Опишіть ваш short...",
      "descriptionHint": "Максимум 500 символів (необов'язково)",
      "category": "Категорія",
      "categoryPlaceholder": "Оберіть категорію",
      "tags": "Теги",
      "tagsPlaceholder": "Додайте до 10 тегів",
      "tagsHint": "Натисніть Enter для додавання тегу",
      "location": "Місцезнаходження",
      "locationPlaceholder": "Пошук місцезнаходження",
      "locationHint": "За замовчуванням — місцезнаходження вашої компанії",
      "ctaLink": "Посилання із закликом до дії",
      "ctaLinkPlaceholder": "https://example.com/ваша-пропозиція",
      "ctaLinkHint": "Необов'язкове посилання, що відображається з вашим short"
    },
    "thumbnail": {
      "title": "Мініатюра",
      "description": "Оберіть мініатюру для вашого short",
      "auto": "Автоматично",
      "autoDescription": "Ми витягнемо кадр з вашого відео",
      "custom": "Завантажити власну",
      "customDescription": "Завантажте своє зображення (1080x1920, макс. 2МБ)",
      "requirements": "JPEG або PNG. Рекомендується співвідношення сторін 9:16."
    },
    "review": {
      "title": "Перевірте ваш Short",
      "description": "Перевірте все перед збереженням",
      "videoPreview": "Попередній перегляд відео",
      "details": "Деталі",
      "thumbnailPreview": "Попередній перегляд мініатюри",
      "edit": "Редагувати"
    },
    "actions": {
      "next": "Далі",
      "back": "Назад",
      "saveDraft": "Зберегти як чернетку",
      "saving": "Збереження...",
      "cancel": "Скасувати"
    }
  },
  "detail": {
    "status": "Статус",
    "createdAt": "Створено",
    "publishedAt": "Опубліковано",
    "expiresAt": "Закінчується",
    "views": "Перегляди",
    "likes": "Вподобання",
    "duration": "Тривалість",
    "category": "Категорія",
    "tags": "Теги",
    "location": "Місцезнаходження",
    "ctaLink": "CTA-посилання"
  },
  "status": {
    "DRAFT": "Чернетка",
    "PENDING_PAYMENT": "Очікує оплати",
    "PROCESSING": "Обробка",
    "PUBLISHED": "Опубліковано",
    "ARCHIVED": "В архіві",
    "DELETED": "Видалено"
  },
  "actions": {
    "view": "Переглянути",
    "edit": "Редагувати",
    "publish": "Опублікувати",
    "archive": "Архівувати",
    "duplicate": "Дублювати",
    "delete": "Видалити",
    "renew": "Продовжити"
  },
  "publish": {
    "title": "Опублікувати Short",
    "description": "Ваш short буде видимий протягом 30 днів",
    "cost": "Вартість публікації",
    "credits": "Ваші кредити",
    "useCredits": "Використати кредити",
    "payNow": "Оплатити {price} PLN",
    "noCredits": "У вас немає кредитів. Придбайте нижче або оплатіть за окремий short.",
    "processing": "Публікація..."
  },
  "publishing": {
    "title": "Публікація вашого Short",
    "description": "Будь ласка, зачекайте, поки ми обробляємо ваше відео",
    "steps": {
      "draft": "Чернетку створено",
      "payment": "Оплату отримано",
      "processing": "Обробка відео...",
      "publishing": "Незабаром публікація"
    },
    "estimatedTime": "Зазвичай займає 2-5 хвилин",
    "success": "Ваш short опубліковано!",
    "viewShort": "Переглянути Short",
    "error": "Помилка обробки",
    "retry": "Повторити",
    "refund": "Запросити повернення"
  },
  "archive": {
    "title": "Архівувати Short",
    "description": "Цей short буде видалено зі стрічки, але він залишиться доступним за прямим посиланням.",
    "confirm": "Так, архівувати"
  },
  "delete": {
    "title": "Видалити чернетку",
    "description": "Цю дію не можна скасувати. Чернетку буде видалено назавжди.",
    "confirm": "Так, видалити"
  },
  "renew": {
    "title": "Продовжити Short",
    "description": "Продовжити видимість ще на 30 днів",
    "cost": "Вартість продовження",
    "renewNow": "Продовжити за {price} PLN"
  },
  "public": {
    "company": "Від",
    "viewProfile": "Переглянути профіль",
    "visitWebsite": "Відвідати сайт",
    "share": "Поділитися",
    "report": "Поскаржитися"
  },
  "table": {
    "thumbnail": "Мініатюра",
    "title": "Назва",
    "status": "Статус",
    "views": "Перегляди",
    "created": "Створено",
    "expires": "Закінчується",
    "actions": "Дії"
  },
  "filters": {
    "all": "Усі",
    "drafts": "Чернетки",
    "published": "Опубліковані",
    "archived": "В архіві",
    "search": "Пошук shorts..."
  },
  "errors": {
    "notFound": "Short не знайдено",
    "unauthorized": "Ви не маєте доступу до цього short",
    "maxDrafts": "Досягнуто максимальної кількості чернеток (10)",
    "uploadFailed": "Не вдалося завантажити відео",
    "createFailed": "Не вдалося створити short",
    "updateFailed": "Не вдалося оновити short",
    "deleteFailed": "Не вдалося видалити short",
    "publishFailed": "Не вдалося опублікувати short",
    "notVerified": "Ваша компанія повинна бути верифікована для публікації shorts",
    "insufficientCredits": "Недостатньо кредитів"
  },
  "success": {
    "created": "Чернетку успішно збережено",
    "updated": "Short успішно оновлено",
    "deleted": "Short успішно видалено",
    "archived": "Short успішно архівовано",
    "published": "Short успішно опубліковано",
    "renewed": "Short успішно продовжено"
  }
}
```

### src/lib/locales/uk/payments.json

```json
{
  "meta": {
    "title": "Платежі",
    "description": "Керуйте платежами та кредитами"
  },
  "credits": {
    "title": "Кредити публікації",
    "balance": "Ваш баланс",
    "creditsAvailable": "{count} кредитів доступно",
    "history": "Історія транзакцій",
    "noHistory": "Транзакцій поки немає",
    "purchase": "Придбати кредити",
    "packages": {
      "title": "Пакети кредитів",
      "single": "Одна публікація",
      "singleDescription": "1 кредит на один short",
      "starter": "Стартовий пакет",
      "starterDescription": "5 кредитів — економія 10%",
      "business": "Бізнес-пакет",
      "businessDescription": "20 кредитів — економія 20%",
      "enterprise": "Enterprise-пакет",
      "enterpriseDescription": "50 кредитів — економія 30%"
    }
  },
  "checkout": {
    "title": "Завершити оплату",
    "summary": "Підсумок замовлення",
    "item": "Кредит публікації",
    "items": "Кредити публікації",
    "subtotal": "Проміжний підсумок",
    "vat": "ПДВ (23%)",
    "total": "Разом",
    "payWith": "Оплатити через",
    "processing": "Обробка платежу...",
    "redirect": "Перенаправлення до платіжного провайдера..."
  },
  "providers": {
    "przelewy24": "Przelewy24",
    "przelewy24Description": "BLIK, банківський переказ, картки, Google Pay",
    "tpay": "Tpay",
    "tpayDescription": "BLIK, банківський переказ, картки, Apple Pay"
  },
  "methods": {
    "blik": "BLIK",
    "bankTransfer": "Банківський переказ",
    "card": "Кредитна/дебетова картка",
    "googlePay": "Google Pay",
    "applePay": "Apple Pay"
  },
  "status": {
    "PENDING": "Очікування",
    "SUCCEEDED": "Завершено",
    "FAILED": "Помилка",
    "REFUNDED": "Повернено"
  },
  "source": {
    "PACKAGE": "Придбання пакета",
    "GIFT": "Подарунок",
    "PROMO": "Промо-акція",
    "REFUND": "Повернення",
    "ADMIN": "Нараховано адміністратором",
    "PUBLICATION": "Публікація",
    "OTHER": "Інше"
  },
  "transaction": {
    "date": "Дата",
    "type": "Тип",
    "amount": "Сума",
    "balance": "Баланс після",
    "shortLink": "Пов'язаний Short"
  },
  "success": {
    "title": "Оплата успішна!",
    "description": "Ваші кредити додано на рахунок.",
    "creditsAdded": "Додано {count} кредитів",
    "viewCredits": "Переглянути кредити",
    "continueShopping": "Створити Short"
  },
  "cancel": {
    "title": "Оплату скасовано",
    "description": "Ваш платіж не було завершено.",
    "tryAgain": "Спробувати знову",
    "backToShorts": "Повернутися до Shorts"
  },
  "errors": {
    "paymentFailed": "Помилка оплати. Будь ласка, спробуйте знову.",
    "invalidAmount": "Невірна сума платежу",
    "providerError": "Помилка платіжного провайдера. Спробуйте інший спосіб.",
    "sessionExpired": "Сесія платежу закінчилася. Почніть спочатку."
  },
  "invoice": {
    "title": "Рахунок",
    "download": "Завантажити рахунок",
    "generating": "Формування рахунку..."
  }
}
```

---

## Summary

This addendum provides complete translation files for the 4 missing locales:

| Locale | shorts.json | payments.json |
|--------|-------------|---------------|
| German (DE) | Complete (120+ keys) | Complete (50+ keys) |
| Spanish (ES) | Complete (120+ keys) | Complete (50+ keys) |
| Russian (RU) | Complete (120+ keys) | Complete (50+ keys) |
| Ukrainian (UK) | Complete (120+ keys) | Complete (50+ keys) |

**All translations:**
- Follow the exact same JSON structure as the EN version from `response_v1.md`
- Preserve all placeholder variables ({count}, {price}, etc.)
- Use native, natural-sounding translations appropriate for each language
- Cover all UI text for the Shorts Upload and Payments features

**Combined with `response_v1.md`, the architecture now provides complete translations for all 6 locales:**
- EN (English) - in response_v1.md
- PL (Polish) - in response_v1.md
- DE (German) - in this addendum
- ES (Spanish) - in this addendum
- RU (Russian) - in this addendum
- UK (Ukrainian) - in this addendum
