import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id }
  })

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileForm
        profile={profile}
        userEmail={session.user.email!}
      />
    </div>
  )
}
