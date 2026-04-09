import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  title: string
  highlight: string
  subtitle: string
  ctaPrimary: string
  ctaSecondary: string
}

export function HeroSection({
  title,
  highlight,
  subtitle,
  ctaPrimary,
  ctaSecondary,
}: HeroSectionProps) {
  return (
    <section className="w-full rounded-2xl overflow-hidden relative min-h-[300px] md:min-h-[360px] flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&h=900&fit=crop"
          alt="Modern collaborative workspace"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/30 dark:from-black/90 dark:via-black/70 dark:to-black/30" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-2xl text-center px-4 flex flex-col items-center gap-6">
        <h1 className="text-foreground dark:text-white text-3xl md:text-5xl font-black leading-tight tracking-tight">
          {title} <span className="text-primary">{highlight}</span>
        </h1>
        <p className="text-muted-foreground dark:text-gray-300 text-base md:text-lg font-medium max-w-lg">
          {subtitle}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            className="h-12 px-6 font-bold text-base transition-all transform hover:scale-105"
          >
            {ctaPrimary}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-6 font-bold text-base bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/10 dark:text-white"
          >
            {ctaSecondary}
          </Button>
        </div>
      </div>
    </section>
  )
}
