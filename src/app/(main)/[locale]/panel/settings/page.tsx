import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PasswordChangeForm } from '@/components/profile/password-change-form'
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog'
import { getTranslations } from 'next-intl/server'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailVerified: true,
      passwordHash: true
    }
  })

  if (!user) {
    redirect('/login')
  }

  const t = await getTranslations('settings')
  const hasPassword = !!user.passwordHash

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      {/* Account Info */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('account.title')}</h2>
        <div className="space-y-2 p-4 border rounded-lg">
          <p>
            <strong>{t('account.email')}:</strong> {user.email}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {user.emailVerified ? (
              <span className="text-green-600">{t('account.emailVerified')}</span>
            ) : (
              <span className="text-yellow-600">{t('account.emailNotVerified')}</span>
            )}
          </p>
        </div>
      </section>

      {/* Password Change (only for non-OAuth users) */}
      {hasPassword && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('password.title')}</h2>
          <div className="p-4 border rounded-lg">
            <PasswordChangeForm />
          </div>
        </section>
      )}

      {/* Danger Zone */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-destructive">
          {t('delete.title')}
        </h2>
        <div className="p-4 border border-destructive rounded-lg">
          <p className="mb-4 text-sm text-muted-foreground">
            {t('delete.warning')}
          </p>
          <DeleteAccountDialog />
        </div>
      </section>
    </div>
  )
}
