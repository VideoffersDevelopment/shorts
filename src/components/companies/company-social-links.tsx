"use client"

import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils/url'

interface SocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
}

interface CompanySocialLinksProps {
  socialLinks: SocialLinks | null
  className?: string
}

// TikTok icon - not available in lucide-react
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const socialConfig = [
  {
    key: 'facebook' as const,
    icon: Facebook,
    label: 'Facebook',
    hoverClass: 'hover:text-blue-600'
  },
  {
    key: 'instagram' as const,
    icon: Instagram,
    label: 'Instagram',
    hoverClass: 'hover:text-pink-500'
  },
  {
    key: 'tiktok' as const,
    icon: TikTokIcon,
    label: 'TikTok',
    hoverClass: 'hover:text-black dark:hover:text-white'
  },
  {
    key: 'youtube' as const,
    icon: Youtube,
    label: 'YouTube',
    hoverClass: 'hover:text-red-600'
  },
  {
    key: 'linkedin' as const,
    icon: Linkedin,
    label: 'LinkedIn',
    hoverClass: 'hover:text-blue-700'
  }
]

export function CompanySocialLinks({ socialLinks, className }: CompanySocialLinksProps) {
  if (!socialLinks) return null

  const activeSocials = socialConfig.filter(
    (social) => socialLinks[social.key] && sanitizeUrl(socialLinks[social.key] ?? null)
  )

  if (activeSocials.length === 0) return null

  return (
    <div className={className ?? "flex items-center gap-4"}>
      {activeSocials.map((social) => {
        const url = sanitizeUrl(socialLinks[social.key] ?? null)
        if (!url) return null

        const Icon = social.icon

        return (
          <a
            key={social.key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className={`text-muted-foreground transition-colors ${social.hoverClass}`}
          >
            <Icon className="h-5 w-5" />
          </a>
        )
      })}
    </div>
  )
}
