import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface CreditExpiry1dEmailProps {
  points: number
  expiresAt: Date
  topUpUrl: string
  locale?: string
}

const translations = {
  en: {
    preview: "LAST DAY - Your credits expire tomorrow!",
    title: "Credits Expire Tomorrow!",
    greeting: "Final notice!",
    body: "Your credits will expire TOMORROW. This is your last chance to top up and extend their validity.",
    pointsLabel: "Expiring credits:",
    expiresLabel: "Expires on:",
    ctaButton: "Top Up Now - Last Chance!",
    footer: "After expiration, credits cannot be recovered. Top up now to save them.",
  },
  pl: {
    preview: "OSTATNI DZIEN - Twoje punkty wygasaja jutro!",
    title: "Punkty wygasaja jutro!",
    greeting: "Ostatnie ostrzezenie!",
    body: "Twoje punkty wygasna JUTRO. To ostatnia szansa na doladowanie i przedluzenie ich waznosci.",
    pointsLabel: "Wygasajace punkty:",
    expiresLabel: "Wygasa:",
    ctaButton: "Doladuj teraz - ostatnia szansa!",
    footer: "Po wygasnieciu punkty nie moga byc odzyskane. Doladuj teraz, aby je ocalic.",
  },
}

function formatDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

export function CreditExpiry1dEmail({
  points,
  expiresAt,
  topUpUrl,
  locale = "en",
}: CreditExpiry1dEmailProps) {
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
            <Section style={infoBox}>
              <Text style={infoRow}>
                <strong>{t.pointsLabel}</strong> {points.toLocaleString()} pkt
              </Text>
              <Text style={infoRow}>
                <strong>{t.expiresLabel}</strong> {formattedDate}
              </Text>
            </Section>
            <Section style={buttonContainer}>
              <Button style={button} href={topUpUrl}>
                {t.ctaButton}
              </Button>
            </Section>
            <Text style={footer}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: "#f6f9fc", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' }
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "20px 0 48px" }
const box = { padding: "0 48px" }
const h1 = { color: "#dc2626", fontSize: "24px", fontWeight: "bold", margin: "40px 0", textAlign: "center" as const }
const text = { color: "#333", fontSize: "16px", lineHeight: "26px", margin: "16px 0" }
const infoBox = { backgroundColor: "#fef2f2", borderRadius: "8px", borderLeft: "4px solid #dc2626", margin: "24px 0", padding: "16px" }
const infoRow = { color: "#333", fontSize: "16px", lineHeight: "24px", margin: "4px 0" }
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" }
const button = { backgroundColor: "#dc2626", borderRadius: "8px", color: "#fff", fontSize: "16px", fontWeight: "bold", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 24px" }
const footer = { color: "#666", fontSize: "14px", lineHeight: "22px", margin: "32px 0 16px", textAlign: "center" as const }

export default CreditExpiry1dEmail
