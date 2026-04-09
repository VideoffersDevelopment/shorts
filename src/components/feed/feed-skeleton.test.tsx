import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@/test/utils'
import { FeedSkeleton, FeedGridSkeleton } from './feed-skeleton'

describe('FeedSkeleton', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders default number of skeleton cards (8)', () => {
      const { container } = render(<FeedSkeleton />)

      // Each skeleton card has aspect-[9/16] class
      const skeletonCards = container.querySelectorAll('.aspect-\\[9\\/16\\]')
      expect(skeletonCards).toHaveLength(8)
    })

    it('renders specified number of skeleton cards', () => {
      const { container } = render(<FeedSkeleton count={5} />)

      const skeletonCards = container.querySelectorAll('.aspect-\\[9\\/16\\]')
      expect(skeletonCards).toHaveLength(5)
    })

    it('renders with count of 1', () => {
      const { container } = render(<FeedSkeleton count={1} />)

      const skeletonCards = container.querySelectorAll('.aspect-\\[9\\/16\\]')
      expect(skeletonCards).toHaveLength(1)
    })

    it('renders with count of 0', () => {
      const { container } = render(<FeedSkeleton count={0} />)

      const skeletonCards = container.querySelectorAll('.aspect-\\[9\\/16\\]')
      expect(skeletonCards).toHaveLength(0)
    })

    it('renders skeleton cards with correct structure', () => {
      const { container } = render(<FeedSkeleton count={1} />)

      const card = container.querySelector('.aspect-\\[9\\/16\\]')
      expect(card).toBeInTheDocument()

      // Check for stats placeholder
      expect(card?.querySelector('.top-3.left-3')).toBeInTheDocument()

      // Check for content placeholder
      expect(card?.querySelector('.bottom-0.left-0')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // SKELETON ELEMENTS
  // ===========================================================================

  describe('Skeleton Elements', () => {
    it('renders main skeleton overlay', () => {
      const { container } = render(<FeedSkeleton count={1} />)

      const card = container.querySelector('.aspect-\\[9\\/16\\]')
      const mainSkeleton = card?.querySelector('.absolute.inset-0')
      expect(mainSkeleton).toBeInTheDocument()
    })

    it('renders stats placeholder skeletons', () => {
      const { container } = render(<FeedSkeleton count={1} />)

      const card = container.querySelector('.aspect-\\[9\\/16\\]')
      const statsArea = card?.querySelector('.top-3.left-3')

      // Should have 2 skeleton badges in stats area
      const statSkeletons = statsArea?.querySelectorAll('.rounded-full')
      expect(statSkeletons).toHaveLength(2)
    })

    it('renders content placeholder skeletons', () => {
      const { container } = render(<FeedSkeleton count={1} />)

      const card = container.querySelector('.aspect-\\[9\\/16\\]')
      const contentArea = card?.querySelector('.bottom-0.left-0')

      // Should have title lines and avatar/name skeletons
      expect(contentArea).toBeInTheDocument()
      expect(contentArea?.querySelector('.h-4.w-full')).toBeInTheDocument()
      expect(contentArea?.querySelector('.h-4.w-3\\/4')).toBeInTheDocument()
      expect(contentArea?.querySelector('.h-5.w-5.rounded-full')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // CUSTOM CLASSNAME
  // ===========================================================================

  describe('Custom ClassName', () => {
    it('applies custom className to skeleton cards', () => {
      const { container } = render(
        <FeedSkeleton count={2} className="custom-class" />
      )

      const cards = container.querySelectorAll('.custom-class')
      expect(cards).toHaveLength(2)
    })

    it('merges custom className with default classes', () => {
      const { container } = render(
        <FeedSkeleton count={1} className="bg-red-500" />
      )

      const card = container.querySelector('.aspect-\\[9\\/16\\]')
      expect(card).toHaveClass('bg-red-500')
      expect(card).toHaveClass('rounded-2xl')
      expect(card).toHaveClass('overflow-hidden')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('skeleton cards are decorative and do not interfere with a11y', () => {
      const { container } = render(<FeedSkeleton count={3} />)

      // Skeletons should not have interactive roles
      const buttons = container.querySelectorAll('[role="button"]')
      expect(buttons).toHaveLength(0)

      const links = container.querySelectorAll('a')
      expect(links).toHaveLength(0)
    })
  })
})

describe('FeedGridSkeleton', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders a grid container', () => {
      const { container } = render(<FeedGridSkeleton />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })

    it('renders 10 skeleton cards by default', () => {
      const { container } = render(<FeedGridSkeleton />)

      const skeletonCards = container.querySelectorAll('.aspect-\\[9\\/16\\]')
      expect(skeletonCards).toHaveLength(10)
    })

    it('has responsive grid classes', () => {
      const { container } = render(<FeedGridSkeleton />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('sm:grid-cols-2')
      expect(grid).toHaveClass('md:grid-cols-3')
      expect(grid).toHaveClass('lg:grid-cols-4')
      expect(grid).toHaveClass('xl:grid-cols-5')
    })

    it('has gap between grid items', () => {
      const { container } = render(<FeedGridSkeleton />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('gap-6')
    })
  })
})
