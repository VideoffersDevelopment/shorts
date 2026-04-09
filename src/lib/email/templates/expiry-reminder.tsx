import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from "@react-email/components"

interface ExpiryReminderEmailProps {
  shortTitle: string
  shortId: string
  expiresAt: Date
  renewUrl: string
  locale?: string
}

// Default translations for the email
const translations = {
  en: {
    preview: "Your short expires in 7 days",
    title: "Your Short Expires Soon!",
    greeting: "Heads up!",
    body: "Your short video will expire in 7 days. Renew it now to keep it visible in the feed.",
    shortLabel: "Short:",
    expiresLabel: "Expires on:",
    renewButton: "Renew Now",
    footer: "Don't miss out - renew your short to continue reaching your audience!",
    unsubscribe: "You're receiving this because you have an active short on VideoShorts."
  },
  pl: {
    preview: "Twoj film wygasa za 7 dni",
    title: "Twoj film wkrotce wygasnie!",
    greeting: "Uwaga!",
    body: "Twoj krotki film wygasnie za 7 dni. Odnow go teraz, aby byl nadal widoczny w kanale.",
    shortLabel: "Film:",
    expiresLabel: "Wygasa:",
    renewButton: "Odnow teraz",
    footer: "Nie przegap - odnow swoj film, aby dalej docierac do swojej publicznosci!",
    unsubscribe: "Otrzymujesz te wiadomosc, poniewaz masz aktywny film na VideoShorts."
  },
  de: {
    preview: "Ihr Video lauft in 7 Tagen ab",
    title: "Ihr Video lauft bald ab!",
    greeting: "Achtung!",
    body: "Ihr Kurzvideo lauft in 7 Tagen ab. Erneuern Sie es jetzt, um es im Feed sichtbar zu halten.",
    shortLabel: "Video:",
    expiresLabel: "Lauft ab am:",
    renewButton: "Jetzt erneuern",
    footer: "Verpassen Sie es nicht - erneuern Sie Ihr Video, um Ihr Publikum weiterhin zu erreichen!",
    unsubscribe: "Sie erhalten diese E-Mail, weil Sie ein aktives Video auf VideoShorts haben."
  },
  es: {
    preview: "Tu video expira en 7 dias",
    title: "Tu video expira pronto!",
    greeting: "Atencion!",
    body: "Tu video corto expirara en 7 dias. Renovalo ahora para mantenerlo visible en el feed.",
    shortLabel: "Video:",
    expiresLabel: "Expira el:",
    renewButton: "Renovar ahora",
    footer: "No te lo pierdas - renueva tu video para seguir llegando a tu audiencia!",
    unsubscribe: "Recibes este correo porque tienes un video activo en VideoShorts."
  },
  ru: {
    preview: "Vash video istekaet cherez 7 dney",
    title: "Vash video skoro istekaet!",
    greeting: "Vnimanie!",
    body: "Vashe korotkoe video istekaet cherez 7 dney. Obnovite ego seychas, chtoby ono ostalos vidimym v lente.",
    shortLabel: "Video:",
    expiresLabel: "Istekaet:",
    renewButton: "Obnovit seychas",
    footer: "Ne propustite - obnovite video, chtoby prodolzhat dochodit do svoey auditorii!",
    unsubscribe: "Vy poluchaete eto pismo, potomu chto u vas est aktivnoe video na VideoShorts."
  },
  uk: {
    preview: "Vashe video spalyuye cherez 7 dniv",
    title: "Vashe video skoro spalyue!",
    greeting: "Uvaga!",
    body: "Vashe korotke video spalyue cherez 7 dniv. Onovit yoho zaraz, shchob vono zalyshylosya vydymym u strichci.",
    shortLabel: "Video:",
    expiresLabel: "Spalyue:",
    renewButton: "Onovyty zaraz",
    footer: "Ne propustit - onovit video, shchob prodovzhuvaty dosyahaty svoyeyi audytoriyi!",
    unsubscribe: "Vy otrymuyete tsey lyst, tomu shcho u vas ye aktyvne video na VideoShorts."
  }
}

function formatDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

export function ExpiryReminderEmail({
  shortTitle,
  shortId,
  expiresAt,
  renewUrl,
  locale = "en"
}: ExpiryReminderEmailProps) {
  const t = translations[locale as keyof typeof translations] || translations.en
  const formattedDate = formatDate(expiresAt, locale)

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>{t.title}</Heading>

            <Text style={text}>{t.greeting}</Text>

            <Text style={text}>{t.body}</Text>

            <Section style={shortInfo}>
              <Text style={infoRow}>
                <strong>{t.shortLabel}</strong> {shortTitle}
              </Text>
              <Text style={infoRow}>
                <strong>{t.expiresLabel}</strong> {formattedDate}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button
                style={button}
                href={renewUrl}
              >
                {t.renewButton}
              </Button>
            </Section>

            <Text style={footer}>
              {t.footer}
            </Text>

            <Text style={footerLink}>
              <Link href={renewUrl} style={link}>
                {renewUrl}
              </Link>
            </Text>

            <Text style={unsubscribe}>
              {t.unsubscribe}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px"
}

const box = {
  padding: "0 48px"
}

const h1 = {
  color: "#f59e0b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0"
}

const shortInfo = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
  margin: "24px 0",
  padding: "16px"
}

const infoRow = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "4px 0"
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0"
}

const button = {
  backgroundColor: "#f59e0b",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px"
}

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "32px 0 16px",
  textAlign: "center" as const
}

const footerLink = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const
}

const link = {
  color: "#556cd6",
  textDecoration: "underline"
}

const unsubscribe = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "24px 0 0",
  textAlign: "center" as const
}

export default ExpiryReminderEmail
