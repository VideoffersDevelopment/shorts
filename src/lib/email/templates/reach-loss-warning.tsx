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

interface ReachLossWarningEmailProps {
  views: number
  promoExpiresAt: Date
  topUpUrl: string
  locale?: string
}

const translations = {
  en: {
    preview: "Your PROMO credits are expiring - don't lose your reach!",
    title: "Don't Lose Your Reach!",
    greeting: "Your free credits are expiring!",
    body: "Your promotional credits are about to expire. Without credits, you won't be able to publish new shorts or boost your existing ones.",
    viewsLabel: "Your total views so far:",
    expiresLabel: "PROMO credits expire:",
    ctaButton: "Buy Credits Now",
    footer: "Purchase a credit package to keep growing your audience on VideoShorts.",
  },
  pl: {
    preview: "Twoje darmowe punkty wygasaja - nie strac zasiegu!",
    title: "Nie strac zasiegu!",
    greeting: "Twoje darmowe punkty wygasaja!",
    body: "Twoje punkty promocyjne wkrotce wygasna. Bez punktow nie bedziesz mogl publikowac nowych filmow ani promowac istniejacych.",
    viewsLabel: "Twoje dotychczasowe wyswietlenia:",
    expiresLabel: "Punkty PROMO wygasaja:",
    ctaButton: "Kup punkty teraz",
    footer: "Kup pakiet punktow, aby dalej budowac swoja publicznosc na VideoShorts.",
  },
}

function formatDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

export function ReachLossWarningEmail({
  views,
  promoExpiresAt,
  topUpUrl,
  locale = "en",
}: ReachLossWarningEmailProps) {
  const t = translations[locale as keyof typeof translations] || translations.en
  const formattedDate = formatDate(promoExpiresAt, locale)

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
                <strong>{t.viewsLabel}</strong> {views.toLocaleString()}
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
const h1 = { color: "#8b5cf6", fontSize: "24px", fontWeight: "bold", margin: "40px 0", textAlign: "center" as const }
const text = { color: "#333", fontSize: "16px", lineHeight: "26px", margin: "16px 0" }
const infoBox = { backgroundColor: "#f3e8ff", borderRadius: "8px", borderLeft: "4px solid #8b5cf6", margin: "24px 0", padding: "16px" }
const infoRow = { color: "#333", fontSize: "16px", lineHeight: "24px", margin: "4px 0" }
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" }
const button = { backgroundColor: "#8b5cf6", borderRadius: "8px", color: "#fff", fontSize: "16px", fontWeight: "bold", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 24px" }
const footer = { color: "#666", fontSize: "14px", lineHeight: "22px", margin: "32px 0 16px", textAlign: "center" as const }

export default ReachLossWarningEmail
