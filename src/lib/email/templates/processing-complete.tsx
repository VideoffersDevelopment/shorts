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

interface ProcessingCompleteEmailProps {
  shortTitle: string
  shortId: string
  publicUrl: string
  locale?: string
}

// Default translations for the email
const translations = {
  en: {
    preview: "Your short is now live!",
    title: "Your Short is Published!",
    greeting: "Great news!",
    body: "Your short video has been successfully processed and is now live for everyone to see.",
    shortLabel: "Short:",
    viewButton: "View Your Short",
    footer: "Thank you for using VideoShorts!"
  },
  pl: {
    preview: "Twoj film jest juz dostepny!",
    title: "Twoj film zostal opublikowany!",
    greeting: "Swietna wiadomosc!",
    body: "Twoj krotki film zostal pomyslnie przetworzony i jest teraz dostepny dla wszystkich.",
    shortLabel: "Film:",
    viewButton: "Zobacz swoj film",
    footer: "Dziekujemy za korzystanie z VideoShorts!"
  }
}

export function ProcessingCompleteEmail({
  shortTitle,
  shortId,
  publicUrl,
  locale = "en"
}: ProcessingCompleteEmailProps) {
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

            <Text style={shortInfo}>
              <strong>{t.shortLabel}</strong> {shortTitle}
            </Text>

            <Section style={buttonContainer}>
              <Button
                style={button}
                href={publicUrl}
              >
                {t.viewButton}
              </Button>
            </Section>

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
  color: "#333",
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
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "24px 0",
  padding: "16px"
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0"
}

const button = {
  backgroundColor: "#000",
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

export default ProcessingCompleteEmail
