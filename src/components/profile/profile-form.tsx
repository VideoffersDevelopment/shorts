"use client"

import { useState, useCallback } from 'react'
import { type UserProfile } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from './avatar-upload'
import { updateProfileAction } from '@/app/actions/profile/update'
import { useTranslations } from '@/lib/i18n/client'
import { toast } from 'sonner'

interface ProfileFormProps {
  profile: UserProfile | null
  userEmail: string
}

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const { t } = useTranslations('profile')
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar ?? '')
  const [saving, setSaving] = useState(false)

  const handleAvatarChange = useCallback((url: string | null) => {
    setAvatar(url ?? '')
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const result = await updateProfileAction({
      displayName: displayName || undefined,
      bio: bio || undefined,
      location: location || undefined,
      avatar: avatar || undefined
    })

    if (result.error) {
      toast.error(result.error)
    } else if (result.success) {
      toast.success(t('success'))
    }

    setSaving(false)
  }, [displayName, bio, location, avatar, t])

  const handleDisplayNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value)
  }, [])

  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value)
  }, [])

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>{t('avatar')}</Label>
            <AvatarUpload
              currentAvatar={avatar}
              userEmail={userEmail}
              onAvatarChange={handleAvatarChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={handleDisplayNameChange}
              placeholder={t('displayNamePlaceholder')}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t('bio')}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={handleBioChange}
              placeholder={t('bioPlaceholder')}
              maxLength={500}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              {bio.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t('location')}</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={handleLocationChange}
              placeholder={t('locationPlaceholder')}
              maxLength={100}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? t('saving') : t('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
