import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Preview
} from '@react-email/components'
import type { PasswordResetTranslations } from '@/lib/email-translations'

interface PasswordResetProps {
  token: string
  locale?: string
  translations: PasswordResetTranslations
}

export function PasswordReset({ token, locale = 'pl', translations }: PasswordResetProps) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/reset-password?token=${token}`

  return (
    <Html>
      <Head />
      <Preview>{translations.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>{translations.title}</Heading>
            <Text style={text}>
              {translations.body}
            </Text>
            <Button href={resetUrl} style={button}>
              {translations.button}
            </Button>
            <Text style={footer}>
              {translations.footer}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px'
}

const section = {
  padding: '0 48px'
}

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848'
}

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#484848'
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  marginTop: '16px',
  marginBottom: '16px'
}

const footer = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#666666',
  marginTop: '20px'
}

export default PasswordReset
