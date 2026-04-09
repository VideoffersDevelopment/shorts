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

interface ShortPublishedEmailProps {
  shortTitle: string
  shortId: string
  publicUrl: string
  expiresAt: Date
  locale?: string
}

// Default translations for the email
const translations = {
  en: {
    preview: "Your short is now live!",
    title: "Your Short is Live!",
    greeting: "Congratulations!",
    body: "Your short video has been published and is now visible to everyone.",
    shortLabel: "Short:",
    expiresLabel: "Visible until:",
    viewButton: "View Your Short",
    shareInfo: "Share your short with the world and watch your audience grow!",
    footer: "Thank you for using VideoShorts!"
  },
  pl: {
    preview: "Twoj film jest juz dostepny!",
    title: "Twoj film jest opublikowany!",
    greeting: "Gratulacje!",
    body: "Twoj krotki film zostal opublikowany i jest teraz widoczny dla wszystkich.",
    shortLabel: "Film:",
    expiresLabel: "Widoczny do:",
    viewButton: "Zobacz swoj film",
    shareInfo: "Udostepnij swoj film swiatu i obserwuj, jak rosnie Twoja widownia!",
    footer: "Dziekujemy za korzystanie z VideoShorts!"
  },
  de: {
    preview: "Ihr Video ist jetzt live!",
    title: "Ihr Video ist live!",
    greeting: "Herzlichen Gluckwunsch!",
    body: "Ihr Kurzvideo wurde veroffentlicht und ist jetzt fur alle sichtbar.",
    shortLabel: "Video:",
    expiresLabel: "Sichtbar bis:",
    viewButton: "Video ansehen",
    shareInfo: "Teilen Sie Ihr Video mit der Welt und beobachten Sie, wie Ihr Publikum wachst!",
    footer: "Vielen Dank, dass Sie VideoShorts nutzen!"
  },
  es: {
    preview: "Tu video ya esta en vivo!",
    title: "Tu video esta en vivo!",
    greeting: "Felicitaciones!",
    body: "Tu video corto ha sido publicado y ahora es visible para todos.",
    shortLabel: "Video:",
    expiresLabel: "Visible hasta:",
    viewButton: "Ver tu video",
    shareInfo: "Comparte tu video con el mundo y mira crecer tu audiencia!",
    footer: "Gracias por usar VideoShorts!"
  },
  ru: {
    preview: "Vash video opublikovano!",
    title: "Vash video opublikovano!",
    greeting: "Pozdravlyaem!",
    body: "Vashe korotkoe video bylo opublikovano i teper vidno vsem.",
    shortLabel: "Video:",
    expiresLabel: "Vidno do:",
    viewButton: "Posmotret video",
    shareInfo: "Podelites svoim video so vsem mirom i nablyudayte, kak rastet vasha auditoriya!",
    footer: "Spasibo za ispolzovanie VideoShorts!"
  },
  uk: {
    preview: "Vashe video opublikovano!",
    title: "Vashe video opublikovano!",
    greeting: "Vitayemo!",
    body: "Vashe korotke video bulo opublikovano i teper vydno vsim.",
    shortLabel: "Video:",
    expiresLabel: "Vydno do:",
    viewButton: "Podyvytysya video",
    shareInfo: "Podilitsya svoim video zi svitom i sposterigayte, yak roste vasha audytoriya!",
    footer: "Dyakuyemo za vykorystannya VideoShorts!"
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

export function ShortPublishedEmail({
  shortTitle,
  shortId,
  publicUrl,
  expiresAt,
  locale = "en"
}: ShortPublishedEmailProps) {
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
                href={publicUrl}
              >
                {t.viewButton}
              </Button>
            </Section>

            <Text style={shareText}>
              {t.shareInfo}
            </Text>

            <Text style={footer}>
              {t.footer}
            </Text>

            <Text style={footerLink}>
              <Link href={publicUrl} style={link}>
                {publicUrl}
              </Link>
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
  color: "#10b981",
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
  backgroundColor: "#d1fae5",
  borderRadius: "8px",
  borderLeft: "4px solid #10b981",
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
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px"
}

const shareText = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  color: "#666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "24px 0",
  padding: "16px",
  textAlign: "center" as const
}

const footer = {
  color: "#8898aa",
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

export default ShortPublishedEmail
