import { VideoCard, VideoCardProps } from "./video-card"

interface VideoGridProps {
  videos: VideoCardProps[]
}

export function VideoGrid({ videos }: VideoGridProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} {...video} />
      ))}
    </section>
  )
}

// Static sample data for demo purposes
export const sampleVideos: VideoCardProps[] = [
  {
    id: "1",
    title: "Joe's Pizza - Best Slice in NYC",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=711&fit=crop",
    views: 4200,
    location: "Brooklyn",
    distance: "0.2 mi",
    company: {
      name: "Joe's Pizza",
      slug: "joes-pizza",
      verified: true,
    },
    ctaText: "Order Now",
    ctaVariant: "primary",
  },
  {
    id: "2",
    title: "Morning Flow - All Levels Welcome",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=711&fit=crop",
    likes: 856,
    location: "SoHo",
    distance: "0.8 mi",
    company: {
      name: "Zen Studio",
      slug: "zen-studio",
      verified: true,
    },
    ctaText: "Book Class",
    ctaVariant: "secondary",
  },
  {
    id: "3",
    title: "New Summer Collection Arrived!",
    thumbnailUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=711&fit=crop",
    views: 12500,
    location: "West Village",
    distance: "1.2 mi",
    company: {
      name: "Urban Thread",
      slug: "urban-thread",
      verified: true,
    },
    ctaText: "Visit Store",
    ctaVariant: "secondary",
  },
  {
    id: "4",
    title: "24/7 Emergency Repairs",
    thumbnailUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=711&fit=crop",
    views: 1100,
    location: "Queens",
    distance: "5.0 mi",
    company: {
      name: "Expert Fixers",
      slug: "expert-fixers",
      verified: false,
    },
    ctaText: "Call Now",
    ctaVariant: "primary",
  },
  {
    id: "5",
    title: "Try our new Lavender Latte",
    thumbnailUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=711&fit=crop",
    likes: 2300,
    location: "Chelsea",
    distance: "0.5 mi",
    company: {
      name: "Bean & Cream",
      slug: "bean-cream",
      verified: true,
    },
    ctaText: "See Menu",
    ctaVariant: "secondary",
  },
  {
    id: "6",
    title: "Office Spaces Available Now",
    thumbnailUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=711&fit=crop",
    views: 940,
    location: "Midtown",
    distance: "1.5 mi",
    company: {
      name: "WorkSpace Inc.",
      slug: "workspace-inc",
      verified: false,
    },
    ctaText: "Inquire",
    ctaVariant: "primary",
  },
  {
    id: "7",
    title: "50% Off First Massage",
    thumbnailUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=711&fit=crop",
    views: 5800,
    location: "Tribeca",
    distance: "1.1 mi",
    company: {
      name: "Glow Spa",
      slug: "glow-spa",
      verified: true,
    },
    ctaText: "Book Now",
    ctaVariant: "secondary",
  },
  {
    id: "8",
    title: "Fresh Fades for Weekend",
    thumbnailUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=711&fit=crop",
    views: 3100,
    location: "Harlem",
    distance: "4.5 mi",
    company: {
      name: "King's Barbers",
      slug: "kings-barbers",
      verified: false,
    },
    ctaText: "Book Seat",
    ctaVariant: "primary",
  },
]
