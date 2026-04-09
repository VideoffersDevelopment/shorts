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

interface CreditExpiry30dEmailProps {
  points: number
  valuePLN: string
  expiresAt: Date
  topUpUrl: string
  locale?: string
}

const translations = {
  en: {
    preview: "Your credits expire in 30 days",
    title: "Credits Expiring Soon",
    greeting: "Heads up!",
    body: "You have credits that will expire in 30 days. Use them or top up to extend their validity.",
    pointsLabel: "Expiring credits:",
    valueLabel: "Approximate value:",
    expiresLabel: "Expires on:",
    ctaButton: "Top Up Now",
    footer: "Top up your account to extend all credit expiration dates by 12 months.",
  },
  pl: {
    preview: "Twoje punkty wygasaja za 30 dni",
    title: "Punkty wkrotce wygasna",
    greeting: "Uwaga!",
    body: "Masz punkty, ktore wygasna za 30 dni. Uzyj ich lub doladuj konto, aby przedluzyc ich waznosc.",
    pointsLabel: "Wygasajace punkty:",
    valueLabel: "Przybliziona wartosc:",
    expiresLabel: "Wygasa:",
    ctaButton: "Doladuj teraz",
    footer: "Doladuj konto, aby przedluzyc waznosc wszystkich punktow o 12 miesiecy.",
  },
}

function formatDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

export function CreditExpiry30dEmail({
  points,
  valuePLN,
  expiresAt,
  topUpUrl,
  locale = "en",
}: CreditExpiry30dEmailProps) {
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
                <strong>{t.valueLabel}</strong> {valuePLN} PLN
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

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "20px 0 48px" }
const box = { padding: "0 48px" }
const h1 = { color: "#f59e0b", fontSize: "24px", fontWeight: "bold", margin: "40px 0", textAlign: "center" as const }
const text = { color: "#333", fontSize: "16px", lineHeight: "26px", margin: "16px 0" }
const infoBox = { backgroundColor: "#fef3c7", borderRadius: "8px", borderLeft: "4px solid #f59e0b", margin: "24px 0", padding: "16px" }
const infoRow = { color: "#333", fontSize: "16px", lineHeight: "24px", margin: "4px 0" }
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" }
const button = { backgroundColor: "#f59e0b", borderRadius: "8px", color: "#fff", fontSize: "16px", fontWeight: "bold", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 24px" }
const footer = { color: "#666", fontSize: "14px", lineHeight: "22px", margin: "32px 0 16px", textAlign: "center" as const }

export default CreditExpiry30dEmail
