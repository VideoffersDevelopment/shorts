import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

/**
 * STATUS_LOSS_WARN — Placeholder Template
 *
 * This template is created for future use when Premium Status
 * (Standard/Premium/Business) tiers are implemented.
 * Currently inactive — no trigger sends this email in MVP.
 */

interface StatusLossWarningEmailProps {
  days: number
  statusName: string
  locale?: string
}

const translations = {
  en: {
    preview: "Your premium status is at risk",
    title: "Premium Status at Risk",
    body: "Your {statusName} status will be downgraded in {days} days due to inactivity. Make a purchase to maintain your benefits.",
    footer: "This is an automated notification from VideoShorts.",
  },
  pl: {
    preview: "Twoj status premium jest zagrozony",
    title: "Status premium zagrozony",
    body: "Twoj status {statusName} zostanie obnizony za {days} dni z powodu braku aktywnosci. Dokonaj zakupu, aby zachowac swoje korzysci.",
    footer: "To jest automatyczne powiadomienie z VideoShorts.",
  },
}

export function StatusLossWarningEmail({
  days,
  statusName,
  locale = "en",
}: StatusLossWarningEmailProps) {
  const t = translations[locale as keyof typeof translations] || translations.en
  const bodyText = t.body
    .replace("{statusName}", statusName)
    .replace("{days}", String(days))

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>{t.title}</Heading>
            <Text style={text}>{bodyText}</Text>
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
const h1 = { color: "#6366f1", fontSize: "24px", fontWeight: "bold", margin: "40px 0", textAlign: "center" as const }
const text = { color: "#333", fontSize: "16px", lineHeight: "26px", margin: "16px 0" }
const footer = { color: "#666", fontSize: "14px", lineHeight: "22px", margin: "32px 0 16px", textAlign: "center" as const }

export default StatusLossWarningEmail
