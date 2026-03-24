import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Avatar from '../components/ui/Avatar'
import { StatusBadge, PriorityBadge, RoleBadge } from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { Users } from 'lucide-react'

// ── Avatar ────────────────────────────────────────────────────────────────────

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="John Doe" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(img).toHaveAttribute('alt', 'John Doe')
  })

  it('renders initials when no src', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders ? for missing name', () => {
    render(<Avatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { container } = render(<Avatar name="AB" size="lg" />)
    expect(container.firstChild).toHaveClass('w-11', 'h-11')
  })
})

// ── StatusBadge ───────────────────────────────────────────────────────────────

describe('StatusBadge', () => {
  it('renders pending badge', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders in_progress badge', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders completed badge', () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('applies correct CSS class for status', () => {
    const { container } = render(<StatusBadge status="completed" />)
    expect(container.firstChild).toHaveClass('badge-completed')
  })
})

// ── PriorityBadge ─────────────────────────────────────────────────────────────

describe('PriorityBadge', () => {
  it.each(['low', 'medium', 'high'])('renders %s priority', (priority) => {
    render(<PriorityBadge priority={priority} />)
    expect(screen.getByText(priority)).toBeInTheDocument()
  })
})

// ── RoleBadge ─────────────────────────────────────────────────────────────────

describe('RoleBadge', () => {
  it.each(['admin', 'manager', 'employee'])('renders %s role', (role) => {
    render(<RoleBadge role={role} />)
    expect(screen.getByText(role)).toBeInTheDocument()
  })
})

// ── StatCard ──────────────────────────────────────────────────────────────────

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Tasks" value={42} icon={Users} />)
    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders em dash when value is undefined', () => {
    render(<StatCard label="Tasks" value={undefined} icon={Users} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders 0 correctly (not em dash)', () => {
    render(<StatCard label="Tasks" value={0} icon={Users} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

// ── Modal ─────────────────────────────────────────────────────────────────────

describe('Modal', () => {
  it('does not render when open is false', () => {
    render(<Modal open={false} onClose={vi.fn()} title="Test Modal"><p>Content</p></Modal>)
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders when open is true', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test Modal"><p>Content</p></Modal>)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Test"><p>Content</p></Modal>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose} title="Test"><p>Content</p></Modal>
    )
    // Click the backdrop overlay (absolute positioned div)
    fireEvent.click(container.querySelector('.absolute.inset-0'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Test"><p>Content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})

// ── Pagination ────────────────────────────────────────────────────────────────

describe('Pagination', () => {
  const meta = { total: 50, per_page: 10, current_page: 1, last_page: 5 }

  it('renders nothing when only one page', () => {
    const { container } = render(
      <Pagination meta={{ ...meta, last_page: 1 }} onPageChange={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when meta is null', () => {
    const { container } = render(<Pagination meta={null} onPageChange={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders page buttons', () => {
    render(<Pagination meta={meta} onPageChange={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onPageChange with next page when next button clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination meta={meta} onPageChange={onPageChange} />)
    // Click the right chevron (next button)
    const buttons = screen.getAllByRole('button')
    const nextBtn = buttons[buttons.length - 1]
    fireEvent.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables prev button on first page', () => {
    render(<Pagination meta={meta} onPageChange={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination meta={{ ...meta, current_page: 5 }} onPageChange={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[buttons.length - 1]).toBeDisabled()
  })

  it('shows correct total count', () => {
    render(<Pagination meta={meta} onPageChange={vi.fn()} />)
    expect(screen.getByText(/Showing 1–10 of 50/)).toBeInTheDocument()
  })
})
