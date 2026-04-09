# Architecture: Core + Auth (Stage 1)

**Project:** videoshorts-stage-01-core-auth
**Type:** GREENFIELD
**Version:** 1.0
**Date:** 2025-11-28

---

## 1. Frontend Specification

### 1.1 Navigation (app-sidebar.tsx pattern)

```typescript
// src/components/layout/app-sidebar.tsx
import { Home, User, Settings, LogOut } from "lucide-react";

const menuItems = [
	{ href: "/panel", icon: Home, label: "sidebar.home" },
	{ href: "/panel/profile", icon: User, label: "sidebar.profile" },
	{ href: "/panel/settings", icon: Settings, label: "sidebar.settings" },
];
```

### 1.2 Routing Table

| Page            | Path                               | Type   | Auth      |
| --------------- | ---------------------------------- | ------ | --------- |
| Login           | /(auth)/[locale]/login             | Client | Public    |
| Signup          | /(auth)/[locale]/signup            | Client | Public    |
| Verify Email    | /(auth)/[locale]/verify-email      | Server | Public    |
| Forgot Password | /(auth)/[locale]/forgot-password   | Client | Public    |
| Reset Password  | /(auth)/[locale]/reset-password    | Client | Public    |
| Dashboard       | /(main)/[locale]/panel             | Server | Protected |
| Profile         | /(main)/[locale]/panel/profile     | Server | Protected |
| Settings        | /(main)/[locale]/panel/settings    | Server | Protected |
| Preferences     | /(main)/[locale]/panel/preferences | Server | Protected |

### 1.3 Translation Keys (ALL 5 languages)

**pl/auth.json**

```json
{
	"login": {
		"title": "Zaloguj się",
		"email": "Email",
		"password": "Hasło",
		"submit": "Zaloguj",
		"forgotPassword": "Zapomniałeś hasła?",
		"noAccount": "Nie masz konta?",
		"signupLink": "Zarejestruj się",
		"google": "Kontynuuj z Google",
		"facebook": "Kontynuuj z Facebook",
		"errors": {
			"invalidCredentials": "Nieprawidłowy email lub hasło",
			"emailNotVerified": "Potwierdź swój adres email"
		}
	},
	"signup": {
		"title": "Zarejestruj się",
		"email": "Email",
		"password": "Hasło",
		"confirmPassword": "Potwierdź hasło",
		"submit": "Zarejestruj",
		"hasAccount": "Masz już konto?",
		"loginLink": "Zaloguj się",
		"verifyEmailSent": "Wysłaliśmy link weryfikacyjny na {{email}}",
		"errors": {
			"emailExists": "Ten email jest już zarejestrowany",
			"passwordsNotMatch": "Hasła nie są takie same",
			"weakPassword": "Hasło musi mieć min. 8 znaków"
		}
	},
	"verifyEmail": {
		"title": "Weryfikacja email",
		"success": "Email został zweryfikowany!",
		"error": "Link wygasł lub jest nieprawidłowy",
		"resend": "Wyślij ponownie"
	},
	"forgotPassword": {
		"title": "Resetuj hasło",
		"email": "Email",
		"submit": "Wyślij link",
		"emailSent": "Link resetujący został wysłany na {{email}}"
	},
	"resetPassword": {
		"title": "Nowe hasło",
		"password": "Nowe hasło",
		"confirmPassword": "Potwierdź hasło",
		"submit": "Zmień hasło",
		"success": "Hasło zostało zmienione"
	}
}
```

**en/auth.json**

```json
{
	"login": {
		"title": "Sign in",
		"email": "Email",
		"password": "Password",
		"submit": "Sign in",
		"forgotPassword": "Forgot password?",
		"noAccount": "Don't have an account?",
		"signupLink": "Sign up",
		"google": "Continue with Google",
		"facebook": "Continue with Facebook",
		"errors": {
			"invalidCredentials": "Invalid email or password",
			"emailNotVerified": "Please verify your email"
		}
	},
	"signup": {
		"title": "Sign up",
		"email": "Email",
		"password": "Password",
		"confirmPassword": "Confirm password",
		"submit": "Sign up",
		"hasAccount": "Already have an account?",
		"loginLink": "Sign in",
		"verifyEmailSent": "We sent a verification link to {{email}}",
		"errors": {
			"emailExists": "This email is already registered",
			"passwordsNotMatch": "Passwords don't match",
			"weakPassword": "Password must be at least 8 characters"
		}
	},
	"verifyEmail": {
		"title": "Verify email",
		"success": "Email verified successfully!",
		"error": "Link expired or invalid",
		"resend": "Resend"
	},
	"forgotPassword": {
		"title": "Reset password",
		"email": "Email",
		"submit": "Send link",
		"emailSent": "Reset link sent to {{email}}"
	},
	"resetPassword": {
		"title": "New password",
		"password": "New password",
		"confirmPassword": "Confirm password",
		"submit": "Change password",
		"success": "Password changed successfully"
	}
}
```

**de/auth.json**

```json
{
	"login": {
		"title": "Anmelden",
		"email": "E-Mail",
		"password": "Passwort",
		"submit": "Anmelden",
		"forgotPassword": "Passwort vergessen?",
		"noAccount": "Noch kein Konto?",
		"signupLink": "Registrieren",
		"google": "Mit Google fortfahren",
		"facebook": "Mit Facebook fortfahren",
		"errors": {
			"invalidCredentials": "Ungültige E-Mail oder Passwort",
			"emailNotVerified": "Bitte bestätigen Sie Ihre E-Mail"
		}
	},
	"signup": {
		"title": "Registrieren",
		"email": "E-Mail",
		"password": "Passwort",
		"confirmPassword": "Passwort bestätigen",
		"submit": "Registrieren",
		"hasAccount": "Schon ein Konto?",
		"loginLink": "Anmelden",
		"verifyEmailSent": "Wir haben einen Bestätigungslink an {{email}} gesendet",
		"errors": {
			"emailExists": "Diese E-Mail ist bereits registriert",
			"passwordsNotMatch": "Passwörter stimmen nicht überein",
			"weakPassword": "Passwort muss mindestens 8 Zeichen lang sein"
		}
	},
	"verifyEmail": {
		"title": "E-Mail bestätigen",
		"success": "E-Mail erfolgreich bestätigt!",
		"error": "Link abgelaufen oder ungültig",
		"resend": "Erneut senden"
	},
	"forgotPassword": {
		"title": "Passwort zurücksetzen",
		"email": "E-Mail",
		"submit": "Link senden",
		"emailSent": "Zurücksetzungslink an {{email}} gesendet"
	},
	"resetPassword": {
		"title": "Neues Passwort",
		"password": "Neues Passwort",
		"confirmPassword": "Passwort bestätigen",
		"submit": "Passwort ändern",
		"success": "Passwort erfolgreich geändert"
	}
}
```

**es/auth.json**

```json
{
	"login": {
		"title": "Iniciar sesión",
		"email": "Correo electrónico",
		"password": "Contraseña",
		"submit": "Iniciar sesión",
		"forgotPassword": "¿Olvidaste tu contraseña?",
		"noAccount": "¿No tienes cuenta?",
		"signupLink": "Regístrate",
		"google": "Continuar con Google",
		"facebook": "Continuar con Facebook",
		"errors": {
			"invalidCredentials": "Email o contraseña inválidos",
			"emailNotVerified": "Por favor verifica tu email"
		}
	},
	"signup": {
		"title": "Registrarse",
		"email": "Correo electrónico",
		"password": "Contraseña",
		"confirmPassword": "Confirmar contraseña",
		"submit": "Registrarse",
		"hasAccount": "¿Ya tienes cuenta?",
		"loginLink": "Iniciar sesión",
		"verifyEmailSent": "Enviamos un enlace de verificación a {{email}}",
		"errors": {
			"emailExists": "Este email ya está registrado",
			"passwordsNotMatch": "Las contraseñas no coinciden",
			"weakPassword": "La contraseña debe tener al menos 8 caracteres"
		}
	},
	"verifyEmail": {
		"title": "Verificar email",
		"success": "¡Email verificado exitosamente!",
		"error": "Enlace expirado o inválido",
		"resend": "Reenviar"
	},
	"forgotPassword": {
		"title": "Restablecer contraseña",
		"email": "Correo electrónico",
		"submit": "Enviar enlace",
		"emailSent": "Enlace de restablecimiento enviado a {{email}}"
	},
	"resetPassword": {
		"title": "Nueva contraseña",
		"password": "Nueva contraseña",
		"confirmPassword": "Confirmar contraseña",
		"submit": "Cambiar contraseña",
		"success": "Contraseña cambiada exitosamente"
	}
}
```

**ru/auth.json**

```json
{
	"login": {
		"title": "Войти",
		"email": "Email",
		"password": "Пароль",
		"submit": "Войти",
		"forgotPassword": "Забыли пароль?",
		"noAccount": "Нет аккаунта?",
		"signupLink": "Зарегистрироваться",
		"google": "Продолжить с Google",
		"facebook": "Продолжить с Facebook",
		"errors": {
			"invalidCredentials": "Неверный email или пароль",
			"emailNotVerified": "Пожалуйста, подтвердите ваш email"
		}
	},
	"signup": {
		"title": "Регистрация",
		"email": "Email",
		"password": "Пароль",
		"confirmPassword": "Подтвердите пароль",
		"submit": "Зарегистрироваться",
		"hasAccount": "Уже есть аккаунт?",
		"loginLink": "Войти",
		"verifyEmailSent": "Мы отправили ссылку для подтверждения на {{email}}",
		"errors": {
			"emailExists": "Этот email уже зарегистрирован",
			"passwordsNotMatch": "Пароли не совпадают",
			"weakPassword": "Пароль должен содержать минимум 8 символов"
		}
	},
	"verifyEmail": {
		"title": "Подтверждение email",
		"success": "Email успешно подтвержден!",
		"error": "Ссылка истекла или недействительна",
		"resend": "Отправить снова"
	},
	"forgotPassword": {
		"title": "Сброс пароля",
		"email": "Email",
		"submit": "Отправить ссылку",
		"emailSent": "Ссылка для сброса отправлена на {{email}}"
	},
	"resetPassword": {
		"title": "Новый пароль",
		"password": "Новый пароль",
		"confirmPassword": "Подтвердите пароль",
		"submit": "Изменить пароль",
		"success": "Пароль успешно изменен"
	}
}
```

**pl/profile.json**

```json
{
	"title": "Profil",
	"displayName": "Nazwa wyświetlana",
	"bio": "Bio",
	"location": "Lokalizacja",
	"avatar": "Zdjęcie profilowe",
	"changeAvatar": "Zmień zdjęcie",
	"removeAvatar": "Usuń zdjęcie",
	"save": "Zapisz zmiany",
	"success": "Profil zaktualizowany",
	"errors": {
		"uploadFailed": "Błąd przesyłania zdjęcia",
		"bioTooLong": "Bio może mieć max. 500 znaków"
	}
}
```

**en/profile.json**

```json
{
	"title": "Profile",
	"displayName": "Display name",
	"bio": "Bio",
	"location": "Location",
	"avatar": "Profile picture",
	"changeAvatar": "Change picture",
	"removeAvatar": "Remove picture",
	"save": "Save changes",
	"success": "Profile updated",
	"errors": {
		"uploadFailed": "Failed to upload image",
		"bioTooLong": "Bio can be max 500 characters"
	}
}
```

**de/profile.json**

```json
{
	"title": "Profil",
	"displayName": "Anzeigename",
	"bio": "Bio",
	"location": "Standort",
	"avatar": "Profilbild",
	"changeAvatar": "Bild ändern",
	"removeAvatar": "Bild entfernen",
	"save": "Änderungen speichern",
	"success": "Profil aktualisiert",
	"errors": {
		"uploadFailed": "Fehler beim Hochladen des Bildes",
		"bioTooLong": "Bio kann max. 500 Zeichen haben"
	}
}
```

**es/profile.json**

```json
{
	"title": "Perfil",
	"displayName": "Nombre para mostrar",
	"bio": "Biografía",
	"location": "Ubicación",
	"avatar": "Foto de perfil",
	"changeAvatar": "Cambiar foto",
	"removeAvatar": "Eliminar foto",
	"save": "Guardar cambios",
	"success": "Perfil actualizado",
	"errors": {
		"uploadFailed": "Error al subir la imagen",
		"bioTooLong": "La biografía puede tener máx. 500 caracteres"
	}
}
```

**ru/profile.json**

```json
{
	"title": "Профиль",
	"displayName": "Отображаемое имя",
	"bio": "О себе",
	"location": "Местоположение",
	"avatar": "Фото профиля",
	"changeAvatar": "Изменить фото",
	"removeAvatar": "Удалить фото",
	"save": "Сохранить изменения",
	"success": "Профиль обновлен",
	"errors": {
		"uploadFailed": "Ошибка загрузки изображения",
		"bioTooLong": "Биография может содержать макс. 500 символов"
	}
}
```

**pl/settings.json**

```json
{
	"title": "Ustawienia",
	"account": {
		"title": "Konto",
		"email": "Email",
		"emailVerified": "Zweryfikowany",
		"emailNotVerified": "Niezweryfikowany",
		"changePassword": "Zmień hasło",
		"deleteAccount": "Usuń konto"
	},
	"password": {
		"title": "Zmiana hasła",
		"current": "Obecne hasło",
		"new": "Nowe hasło",
		"confirm": "Potwierdź hasło",
		"submit": "Zmień hasło",
		"success": "Hasło zmienione",
		"errors": { "wrongPassword": "Nieprawidłowe obecne hasło" }
	},
	"delete": {
		"title": "Usuń konto",
		"warning": "Ta operacja jest nieodwracalna",
		"confirm": "Wpisz 'DELETE' aby potwierdzić",
		"submit": "Usuń moje konto",
		"success": "Konto zostało usunięte"
	}
}
```

**en/settings.json**

```json
{
	"title": "Settings",
	"account": {
		"title": "Account",
		"email": "Email",
		"emailVerified": "Verified",
		"emailNotVerified": "Not verified",
		"changePassword": "Change password",
		"deleteAccount": "Delete account"
	},
	"password": {
		"title": "Change password",
		"current": "Current password",
		"new": "New password",
		"confirm": "Confirm password",
		"submit": "Change password",
		"success": "Password changed",
		"errors": { "wrongPassword": "Wrong current password" }
	},
	"delete": {
		"title": "Delete account",
		"warning": "This action is irreversible",
		"confirm": "Type 'DELETE' to confirm",
		"submit": "Delete my account",
		"success": "Account deleted"
	}
}
```

**de/settings.json**

```json
{
	"title": "Einstellungen",
	"account": {
		"title": "Konto",
		"email": "E-Mail",
		"emailVerified": "Bestätigt",
		"emailNotVerified": "Nicht bestätigt",
		"changePassword": "Passwort ändern",
		"deleteAccount": "Konto löschen"
	},
	"password": {
		"title": "Passwort ändern",
		"current": "Aktuelles Passwort",
		"new": "Neues Passwort",
		"confirm": "Passwort bestätigen",
		"submit": "Passwort ändern",
		"success": "Passwort geändert",
		"errors": { "wrongPassword": "Falsches aktuelles Passwort" }
	},
	"delete": {
		"title": "Konto löschen",
		"warning": "Diese Aktion ist unwiderruflich",
		"confirm": "Geben Sie 'DELETE' ein, um zu bestätigen",
		"submit": "Mein Konto löschen",
		"success": "Konto gelöscht"
	}
}
```

**es/settings.json**

```json
{
	"title": "Configuración",
	"account": {
		"title": "Cuenta",
		"email": "Correo electrónico",
		"emailVerified": "Verificado",
		"emailNotVerified": "No verificado",
		"changePassword": "Cambiar contraseña",
		"deleteAccount": "Eliminar cuenta"
	},
	"password": {
		"title": "Cambiar contraseña",
		"current": "Contraseña actual",
		"new": "Nueva contraseña",
		"confirm": "Confirmar contraseña",
		"submit": "Cambiar contraseña",
		"success": "Contraseña cambiada",
		"errors": { "wrongPassword": "Contraseña actual incorrecta" }
	},
	"delete": {
		"title": "Eliminar cuenta",
		"warning": "Esta acción es irreversible",
		"confirm": "Escribe 'DELETE' para confirmar",
		"submit": "Eliminar mi cuenta",
		"success": "Cuenta eliminada"
	}
}
```

**ru/settings.json**

```json
{
	"title": "Настройки",
	"account": {
		"title": "Аккаунт",
		"email": "Email",
		"emailVerified": "Подтвержден",
		"emailNotVerified": "Не подтвержден",
		"changePassword": "Изменить пароль",
		"deleteAccount": "Удалить аккаунт"
	},
	"password": {
		"title": "Изменение пароля",
		"current": "Текущий пароль",
		"new": "Новый пароль",
		"confirm": "Подтвердите пароль",
		"submit": "Изменить пароль",
		"success": "Пароль изменен",
		"errors": { "wrongPassword": "Неверный текущий пароль" }
	},
	"delete": {
		"title": "Удалить аккаунт",
		"warning": "Это действие необратимо",
		"confirm": "Введите 'DELETE' для подтверждения",
		"submit": "Удалить мой аккаунт",
		"success": "Аккаунт удален"
	}
}
```

**pl/preferences.json**

```json
{
	"title": "Preferencje",
	"theme": {
		"title": "Wygląd",
		"light": "Jasny",
		"dark": "Ciemny",
		"system": "Systemowy"
	},
	"language": {
		"title": "Język",
		"pl": "Polski",
		"en": "English",
		"de": "Deutsch",
		"es": "Español",
		"ru": "Русский"
	},
	"save": "Zapisz",
	"success": "Preferencje zaktualizowane"
}
```

**en/preferences.json**

```json
{
	"title": "Preferences",
	"theme": {
		"title": "Appearance",
		"light": "Light",
		"dark": "Dark",
		"system": "System"
	},
	"language": {
		"title": "Language",
		"pl": "Polski",
		"en": "English",
		"de": "Deutsch",
		"es": "Español",
		"ru": "Русский"
	},
	"save": "Save",
	"success": "Preferences updated"
}
```

**de/preferences.json**

```json
{
	"title": "Einstellungen",
	"theme": {
		"title": "Erscheinungsbild",
		"light": "Hell",
		"dark": "Dunkel",
		"system": "System"
	},
	"language": {
		"title": "Sprache",
		"pl": "Polski",
		"en": "English",
		"de": "Deutsch",
		"es": "Español",
		"ru": "Русский"
	},
	"save": "Speichern",
	"success": "Einstellungen aktualisiert"
}
```

**es/preferences.json**

```json
{
	"title": "Preferencias",
	"theme": {
		"title": "Apariencia",
		"light": "Claro",
		"dark": "Oscuro",
		"system": "Sistema"
	},
	"language": {
		"title": "Idioma",
		"pl": "Polski",
		"en": "English",
		"de": "Deutsch",
		"es": "Español",
		"ru": "Русский"
	},
	"save": "Guardar",
	"success": "Preferencias actualizadas"
}
```

**ru/preferences.json**

```json
{
	"title": "Настройки",
	"theme": {
		"title": "Внешний вид",
		"light": "Светлый",
		"dark": "Темный",
		"system": "Системный"
	},
	"language": {
		"title": "Язык",
		"pl": "Polski",
		"en": "English",
		"de": "Deutsch",
		"es": "Español",
		"ru": "Русский"
	},
	"save": "Сохранить",
	"success": "Настройки обновлены"
}
```

**pl/common.json**

```json
{
	"loading": "Ładowanie...",
	"error": "Wystąpił błąd",
	"cancel": "Anuluj",
	"submit": "Zatwierdź",
	"back": "Wstecz",
	"next": "Dalej",
	"delete": "Usuń",
	"edit": "Edytuj",
	"save": "Zapisz",
	"close": "Zamknij"
}
```

**en/common.json**

```json
{
	"loading": "Loading...",
	"error": "An error occurred",
	"cancel": "Cancel",
	"submit": "Submit",
	"back": "Back",
	"next": "Next",
	"delete": "Delete",
	"edit": "Edit",
	"save": "Save",
	"close": "Close"
}
```

**de/common.json**

```json
{
	"loading": "Lädt...",
	"error": "Ein Fehler ist aufgetreten",
	"cancel": "Abbrechen",
	"submit": "Bestätigen",
	"back": "Zurück",
	"next": "Weiter",
	"delete": "Löschen",
	"edit": "Bearbeiten",
	"save": "Speichern",
	"close": "Schließen"
}
```

**es/common.json**

```json
{
	"loading": "Cargando...",
	"error": "Ocurrió un error",
	"cancel": "Cancelar",
	"submit": "Enviar",
	"back": "Atrás",
	"next": "Siguiente",
	"delete": "Eliminar",
	"edit": "Editar",
	"save": "Guardar",
	"close": "Cerrar"
}
```

**ru/common.json**

```json
{
	"loading": "Загрузка...",
	"error": "Произошла ошибка",
	"cancel": "Отмена",
	"submit": "Отправить",
	"back": "Назад",
	"next": "Далее",
	"delete": "Удалить",
	"edit": "Редактировать",
	"save": "Сохранить",
	"close": "Закрыть"
}
```

**pl/sidebar.json**

```json
{
	"home": "Strona główna",
	"profile": "Profil",
	"settings": "Ustawienia",
	"logout": "Wyloguj"
}
```

**en/sidebar.json**

```json
{
	"home": "Home",
	"profile": "Profile",
	"settings": "Settings",
	"logout": "Logout"
}
```

**de/sidebar.json**

```json
{
	"home": "Startseite",
	"profile": "Profil",
	"settings": "Einstellungen",
	"logout": "Abmelden"
}
```

**es/sidebar.json**

```json
{
	"home": "Inicio",
	"profile": "Perfil",
	"settings": "Configuración",
	"logout": "Cerrar sesión"
}
```

**ru/sidebar.json**

```json
{
	"home": "Главная",
	"profile": "Профиль",
	"settings": "Настройки",
	"logout": "Выйти"
}
```

### 1.4 User Flows

**Authentication Flow:**

- Signup → Email verification → Login → Dashboard
- OAuth (Google/Facebook) → Profile completion → Dashboard
- Forgot password → Email link → Reset password → Login

**Profile Management:**

- Edit profile → Upload avatar (R2 presigned URL) → Save → Revalidate
- Change password → Verify current → Set new → Re-login
- Delete account → Soft delete → Logout

**Dark Mode:**

- Toggle in preferences → Save to UserProfile.darkMode → next-themes updates

**Locale Switching:**

- Change language → Cookie update → Middleware redirects to new locale

---

## 2. Project Structure

```
shorts/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── [locale]/
│   │   │       ├── login/
│   │   │       │   └── page.tsx
│   │   │       ├── signup/
│   │   │       │   └── page.tsx
│   │   │       ├── verify-email/
│   │   │       │   └── page.tsx
│   │   │       ├── forgot-password/
│   │   │       │   └── page.tsx
│   │   │       └── reset-password/
│   │   │           └── page.tsx
│   │   ├── (main)/
│   │   │   └── [locale]/
│   │   │       └── panel/
│   │   │           ├── page.tsx
│   │   │           ├── profile/
│   │   │           │   └── page.tsx
│   │   │           ├── settings/
│   │   │           │   └── page.tsx
│   │   │           └── preferences/
│   │   │               └── page.tsx
│   │   ├── actions/
│   │   │   ├── auth/
│   │   │   │   ├── signup.ts
│   │   │   │   ├── verify-email.ts
│   │   │   │   ├── forgot-password.ts
│   │   │   │   └── reset-password.ts
│   │   │   └── profile/
│   │   │       ├── update.ts
│   │   │       ├── change-password.ts
│   │   │       └── delete-account.ts
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── users/
│   │   │       └── me/
│   │   │           └── avatar/
│   │   │               └── route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   ├── oauth-buttons.tsx
│   │   │   ├── forgot-password-form.tsx
│   │   │   └── reset-password-form.tsx
│   │   ├── profile/
│   │   │   ├── profile-form.tsx
│   │   │   ├── avatar-upload.tsx
│   │   │   ├── password-change-form.tsx
│   │   │   ├── delete-account-dialog.tsx
│   │   │   └── preferences-form.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── user-menu.tsx
│   │   │   └── mobile-drawer.tsx
│   │   ├── theme/
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── shared/
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── locale-switcher.tsx
│   │   └── ui/ (shadcn)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── textarea.tsx
│   │       ├── label.tsx
│   │       ├── form.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── sheet.tsx
│   │       ├── avatar.tsx
│   │       ├── separator.tsx
│   │       ├── toast.tsx
│   │       └── alert.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── r2.ts
│   │   ├── resend.ts
│   │   ├── validation.ts
│   │   ├── utils.ts
│   │   └── locales/
│   │       ├── pl/
│   │       │   ├── auth.json
│   │       │   ├── profile.json
│   │       │   ├── settings.json
│   │       │   ├── preferences.json
│   │       │   ├── common.json
│   │       │   └── sidebar.json
│   │       ├── en/
│   │       ├── de/
│   │       ├── es/
│   │       └── ru/
│   ├── emails/
│   │   ├── verify-email.tsx
│   │   ├── password-reset.tsx
│   │   └── welcome.tsx
│   └── middleware.ts
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Database Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  COMPANY
  ADMIN
}

// NextAuth models
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  role          Role      @default(USER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now()) @db.Timestamptz
  updatedAt     DateTime  @updatedAt @db.Timestamptz

  profile  UserProfile?
  accounts Account[]
  sessions Session[]

  @@index([email])
  @@index([role])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime @db.Timestamptz

  @@unique([identifier, token])
}

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  avatar      String?
  bio         String?  @db.Text
  location    String?
  latitude    Float?
  longitude   Float?
  preferences Json?
  darkMode    Boolean  @default(false)
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([latitude, longitude])
}
```

---

## 4. Server Actions

| Action               | Path                                       | Input                                                                                              | Output                                   |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| signupAction         | src/app/actions/auth/signup.ts             | `{ email: string, password: string }`                                                              | `{ success: true } \| { error: string }` |
| verifyEmailAction    | src/app/actions/auth/verify-email.ts       | `{ token: string }`                                                                                | `{ success: true } \| { error: string }` |
| forgotPasswordAction | src/app/actions/auth/forgot-password.ts    | `{ email: string }`                                                                                | `{ success: true }`                      |
| resetPasswordAction  | src/app/actions/auth/reset-password.ts     | `{ token: string, password: string }`                                                              | `{ success: true } \| { error: string }` |
| updateProfileAction  | src/app/actions/profile/update.ts          | `{ displayName?: string, bio?: string, location?: string, latitude?: number, longitude?: number }` | `{ success: true } \| { error: string }` |
| changePasswordAction | src/app/actions/profile/change-password.ts | `{ currentPassword: string, newPassword: string }`                                                 | `{ success: true } \| { error: string }` |
| deleteAccountAction  | src/app/actions/profile/delete-account.ts  | `{ confirmation: string }`                                                                         | `{ success: true } \| { error: string }` |

---

## 5. Components

| Component           | Path                                             | Type   | Props                                                  |
| ------------------- | ------------------------------------------------ | ------ | ------------------------------------------------------ |
| **Auth**            |
| LoginForm           | src/components/auth/login-form.tsx               | Client | `{}`                                                   |
| SignupForm          | src/components/auth/signup-form.tsx              | Client | `{}`                                                   |
| OAuthButtons        | src/components/auth/oauth-buttons.tsx            | Client | `{}`                                                   |
| ForgotPasswordForm  | src/components/auth/forgot-password-form.tsx     | Client | `{}`                                                   |
| ResetPasswordForm   | src/components/auth/reset-password-form.tsx      | Client | `{ token: string }`                                    |
| **Profile**         |
| ProfileForm         | src/components/profile/profile-form.tsx          | Client | `{ user: User & { profile: UserProfile } }`            |
| AvatarUpload        | src/components/profile/avatar-upload.tsx         | Client | `{ avatar?: string, onUpload: (url: string) => void }` |
| PasswordChangeForm  | src/components/profile/password-change-form.tsx  | Client | `{}`                                                   |
| DeleteAccountDialog | src/components/profile/delete-account-dialog.tsx | Client | `{}`                                                   |
| PreferencesForm     | src/components/profile/preferences-form.tsx      | Client | `{ darkMode: boolean, locale: string }`                |
| **Layout**          |
| Header              | src/components/layout/header.tsx                 | Server | `{}`                                                   |
| AppSidebar          | src/components/layout/app-sidebar.tsx            | Server | `{ locale: string }`                                   |
| Footer              | src/components/layout/footer.tsx                 | Server | `{}`                                                   |
| UserMenu            | src/components/layout/user-menu.tsx              | Client | `{ user: User }`                                       |
| MobileDrawer        | src/components/layout/mobile-drawer.tsx          | Client | `{}`                                                   |
| **Theme**           |
| ThemeProvider       | src/components/theme/theme-provider.tsx          | Client | `{ children: ReactNode }`                              |
| ThemeToggle         | src/components/theme/theme-toggle.tsx            | Client | `{}`                                                   |
| **Shared**          |
| LoadingSpinner      | src/components/shared/loading-spinner.tsx        | Client | `{ size?: 'sm' \| 'md' \| 'lg' }`                      |
| ErrorBoundary       | src/components/shared/error-boundary.tsx         | Client | `{ children: ReactNode }`                              |
| LocaleSwitcher      | src/components/shared/locale-switcher.tsx        | Client | `{ locale: string }`                                   |
| **UI (shadcn)**     |
| Button              | src/components/ui/button.tsx                     | Client | shadcn props                                           |
| Input               | src/components/ui/input.tsx                      | Client | shadcn props                                           |
| Textarea            | src/components/ui/textarea.tsx                   | Client | shadcn props                                           |
| Label               | src/components/ui/label.tsx                      | Client | shadcn props                                           |
| Form                | src/components/ui/form.tsx                       | Client | shadcn props                                           |
| Dialog              | src/components/ui/dialog.tsx                     | Client | shadcn props                                           |
| DropdownMenu        | src/components/ui/dropdown-menu.tsx              | Client | shadcn props                                           |
| Sheet               | src/components/ui/sheet.tsx                      | Client | shadcn props                                           |
| Avatar              | src/components/ui/avatar.tsx                     | Client | shadcn props                                           |
| Separator           | src/components/ui/separator.tsx                  | Client | shadcn props                                           |
| Toast               | src/components/ui/toast.tsx                      | Client | shadcn props                                           |
| Alert               | src/components/ui/alert.tsx                      | Client | shadcn props                                           |

---

## 6. External Services

### NextAuth Configuration

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
	pages: {
		signIn: "/login",
		error: "/login",
	},
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		FacebookProvider({
			clientId: process.env.FACEBOOK_CLIENT_ID!,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
		}),
		CredentialsProvider({
			credentials: {
				email: { type: "email" },
				password: { type: "password" },
			},
			async authorize(credentials) {
				const user = await prisma.user.findUnique({
					where: { email: credentials.email as string },
				});
				if (!user?.passwordHash) return null;
				const valid = await bcrypt.compare(
					credentials.password as string,
					user.passwordHash
				);
				if (!valid) return null;
				if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
				return { id: user.id, email: user.email, role: user.role };
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			session.user.id = token.id as string;
			session.user.role = token.role as string;
			return session;
		},
	},
});
```

### Prisma Client

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Cloudflare R2 Client

```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT!,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
});

export async function getUploadUrl(key: string, contentType: string) {
	const command = new PutObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME!,
		Key: key,
		ContentType: contentType,
	});
	return getSignedUrl(r2, command, { expiresIn: 3600 });
}

export function getPublicUrl(key: string) {
	return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

### Resend Client

```typescript
// src/lib/resend.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(email: string, token: string) {
	const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
	await resend.emails.send({
		from: "VideoShorts <noreply@videoffers.com>",
		to: email,
		subject: "Verify your email",
		html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
	});
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
	await resend.emails.send({
		from: "VideoShorts <noreply@videoffers.com>",
		to: email,
		subject: "Reset your password",
		html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
	});
}
```

---

## 7. Middleware

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";

const intlMiddleware = createMiddleware({
	locales: ["pl", "en", "de", "es", "ru"],
	defaultLocale: "pl",
	localePrefix: "always",
});

export default async function middleware(req: NextRequest) {
	// 1. Locale detection
	const response = intlMiddleware(req);

	// 2. Auth protection
	const session = await auth();
	const isAuthPage = req.nextUrl.pathname.match(
		/\/(login|signup|verify-email|forgot-password|reset-password)/
	);
	const isProtectedPage = req.nextUrl.pathname.includes("/panel");

	if (isProtectedPage && !session) {
		const locale = req.nextUrl.pathname.split("/")[1];
		return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
	}

	if (isAuthPage && session) {
		const locale = req.nextUrl.pathname.split("/")[1];
		return NextResponse.redirect(new URL(`/${locale}/panel`, req.url));
	}

	return response;
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

---

## 8. Implementation Phases

### Phase 1: Project Setup

- `npx create-next-app@latest shorts --typescript --tailwind --app --src-dir`
- Install dependencies: `next-auth`, `@prisma/client`, `@aws-sdk/client-s3`, `resend`, `react-hook-form`, `zod`, `next-themes`, `next-intl`, `bcryptjs`, `lucide-react`
- Configure `next.config.js` for i18n
- Setup Prisma schema and migrate
- Configure environment variables

### Phase 2: Core Infrastructure

- Setup NextAuth (`lib/auth.ts`)
- Setup Prisma client (`lib/prisma.ts`)
- Setup R2 client (`lib/r2.ts`)
- Setup Resend client (`lib/resend.ts`)
- Setup middleware (locale + auth)
- Install shadcn/ui components

### Phase 3: Authentication

- Create auth pages (login, signup, verify-email, forgot-password, reset-password)
- Create auth components (forms, OAuth buttons)
- Create auth server actions
- Create email templates
- Test full auth flow

### Phase 4: Profile Management

- Create profile page and form
- Create avatar upload component
- Create profile update server action
- Test profile CRUD

### Phase 5: Settings & Preferences

- Create settings page (password change, account deletion)
- Create preferences page (theme, locale)
- Create settings server actions
- Test all settings flows

### Phase 6: Layout & Navigation

- Create main layout (header, sidebar, footer)
- Create user menu component
- Create mobile drawer
- Create theme provider and toggle
- Create locale switcher
- Add all translations (5 languages)

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret"

# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""

# Cloudflare R2
R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="videoshorts"
R2_PUBLIC_URL="https://cdn.videoffers.com"

# Resend
RESEND_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Tech Stack Summary

| Layer        | Technologies                                                                   |
| ------------ | ------------------------------------------------------------------------------ |
| **Frontend** | Next.js 14+, React 19, TypeScript, Tailwind, shadcn/ui, next-themes, next-intl |
| **Backend**  | Next.js API Routes, Server Actions, NextAuth.js v5, Prisma                     |
| **Database** | Neon DB (PostgreSQL 15+)                                                       |
| **Storage**  | Cloudflare R2                                                                  |
| **Email**    | Resend                                                                         |
| **Hosting**  | Vercel                                                                         |

---

**Total Lines:** ~1200 (under 3000 limit)
