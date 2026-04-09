import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { Button } from './button'

describe('Button', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe('variants', () => {
    it('applies default variant styles', () => {
      render(<Button>Default</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-primary')
    })

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')
    })

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border')
    })

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
    })
  })

  // ===========================================================================
  // SIZES
  // ===========================================================================

  describe('sizes', () => {
    it('applies default size', () => {
      render(<Button>Default Size</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-10')
    })

    it('applies small size', () => {
      render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-9')
    })

    it('applies large size', () => {
      render(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-11')
    })

    it('applies icon size', () => {
      render(<Button size="icon">X</Button>)
      expect(screen.getByRole('button')).toHaveClass('w-10')
    })
  })

  // ===========================================================================
  // STATES
  // ===========================================================================

  describe('states', () => {
    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50')
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      const { user } = render(<Button onClick={handleClick}>Click me</Button>)

      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const { user } = render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>
      )

      await user.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('accessibility', () => {
    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>)
      expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument()
    })

    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })
})
