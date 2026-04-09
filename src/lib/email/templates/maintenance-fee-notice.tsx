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

interface MaintenanceFeeNoticeEmailProps {
  amount: number
  remainingBalance: number
  topUpUrl: string
  locale?: string
}

const translations = {
  en: {
    preview: "Upcoming maintenance fee on your account",
    title: "Maintenance Fee Notice",
    greeting: "Account inactivity alert",
    body: "Your VideoShorts account has been inactive for over 11 months. A monthly maintenance fee will be charged from your credit balance starting next month if no activity is detected.",
    feeLabel: "Monthly fee:",
    balanceLabel: "Current balance:",
    ctaButton: "Use Credits Now",
    footer: "Any activity (publishing, boosting, or purchasing) resets the inactivity timer.",
    tip: "Tip: Publish a short or top up your account to avoid the maintenance fee.",
  },
  pl: {
    preview: "Nadchodzaca oplata utrzymaniowa na Twoim koncie",
    title: "Powiadomienie o oplacie utrzymaniowej",
    greeting: "Alert nieaktywnosci konta",
    body: "Twoje konto VideoShorts jest nieaktywne od ponad 11 miesiecy. Od przyszlego miesiaca zostanie pobierana miesieczna oplata utrzymaniowa z Twojego salda punktow.",
    feeLabel: "Oplata miesieczna:",
    balanceLabel: "Obecne saldo:",
    ctaButton: "Uzyj punktow teraz",
    footer: "Kazda aktywnosc (publikacja, boost, zakup) resetuje licznik nieaktywnosci.",
    tip: "Wskazowka: Opublikuj film lub doladuj konto, aby uniknac oplaty utrzymaniowej.",
  },
}

export function MaintenanceFeeNoticeEmail({
  amount,
  remainingBalance,
  topUpUrl,
  locale = "en",
}: MaintenanceFeeNoticeEmailProps) {
  const t = translations[locale as keyof typeof translations] || translations.en

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
                <strong>{t.feeLabel}</strong> {amount.toLocaleString()} pkt
              </Text>
              <Text style={infoRow}>
                <strong>{t.balanceLabel}</strong> {remainingBalance.toLocaleString()} pkt
              </Text>
            </Section>
            <Text style={tipText}>{t.tip}</Text>
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
const h1 = { color: "#d97706", fontSize: "24px", fontWeight: "bold", margin: "40px 0", textAlign: "center" as const }
const text = { color: "#333", fontSize: "16px", lineHeight: "26px", margin: "16px 0" }
const infoBox = { backgroundColor: "#fffbeb", borderRadius: "8px", borderLeft: "4px solid #d97706", margin: "24px 0", padding: "16px" }
const infoRow = { color: "#333", fontSize: "16px", lineHeight: "24px", margin: "4px 0" }
const tipText = { color: "#059669", fontSize: "14px", lineHeight: "22px", margin: "16px 0", fontStyle: "italic" }
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" }
const button = { backgroundColor: "#d97706", borderRadius: "8px", color: "#fff", fontSize: "16px", fontWeight: "bold", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 24px" }
const footer = { color: "#666", fontSize: "14px", lineHeight: "22px", margin: "32px 0 16px", textAlign: "center" as const }

export default MaintenanceFeeNoticeEmail
