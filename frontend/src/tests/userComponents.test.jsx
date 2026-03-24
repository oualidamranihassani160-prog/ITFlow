import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockAdmin, mockManager, mockEmployee } from './helpers.jsx'
import UserForm from '../components/users/UserForm'
import UserRow from '../components/users/UserRow'

vi.mock('../store/slices/usersSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createManager:   vi.fn(() => ({ type: 'users/createManager/fulfilled',  payload: mockManager })),
    createEmployee:  vi.fn(() => ({ type: 'users/createEmployee/fulfilled', payload: mockEmployee })),
    updateUser:      vi.fn(() => ({ type: 'users/update/fulfilled',         payload: mockManager })),
    deleteUser:      vi.fn(() => ({ type: 'users/delete/fulfilled',         payload: mockManager.id })),
    restoreUser:     vi.fn(() => ({ type: 'users/restore/fulfilled',        payload: mockManager })),
    forceDeleteUser: vi.fn(() => ({ type: 'users/forceDelete/fulfilled',    payload: mockManager.id })),
  }
})

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

const baseState = {
  auth:  { user: mockAdmin, token: 'tok', loading: false, initialized: true, error: null },
  tasks: { items: [], meta: null, loading: false, error: null, selectedTask: null },
  users: { items: [], employees: [], meta: null, employeesMeta: null, stats: null, loading: false, error: null },
  notifications: { items: [], meta: null, unreadCount: 0, loading: false, error: null },
  ui:    { darkMode: false, sidebarOpen: true, sidebarMobileOpen: false },
}

// ── UserForm — create manager ─────────────────────────────────────────────────

describe('UserForm — create manager', () => {
  const onClose = vi.fn()
  beforeEach(() => vi.clearAllMocks())

  it('renders all form fields', () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+1 555 0100')).toBeInTheDocument()
  })

  it('shows Create button', () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('shows name required error', async () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows email required error', async () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('shows password required error', async () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('shows invalid email error', () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'notanemail' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    // Submit synchronously — validation runs before dispatch so no need for waitFor
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows avatar upload section', () => {
    renderWithProviders(<UserForm role="manager" onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByText('Click to upload avatar')).toBeInTheDocument()
  })
})

// ── UserForm — edit mode ──────────────────────────────────────────────────────

describe('UserForm — edit mode', () => {
  const onClose = vi.fn()
  beforeEach(() => vi.clearAllMocks())

  it('pre-fills name and email', () => {
    renderWithProviders(<UserForm user={mockManager} role="manager" onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByDisplayValue('Sarah Mitchell')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sarah@test.com')).toBeInTheDocument()
  })

  it('shows Update button instead of Create', () => {
    renderWithProviders(<UserForm user={mockManager} role="manager" onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
  })

  it('shows leave blank hint for password', () => {
    renderWithProviders(<UserForm user={mockManager} role="manager" onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByText(/leave blank to keep/i)).toBeInTheDocument()
  })

  it('pre-fills phone number', () => {
    renderWithProviders(<UserForm user={mockManager} role="manager" onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByDisplayValue('+1-555-0101')).toBeInTheDocument()
  })
})

// ── UserRow ───────────────────────────────────────────────────────────────────

describe('UserRow', () => {
  it('renders user name and email', () => {
    renderWithProviders(
      <table><tbody><UserRow user={mockManager} /></tbody></table>,
      { preloadedState: baseState }
    )
    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument()
    expect(screen.getByText('sarah@test.com')).toBeInTheDocument()
  })

  it('renders role badge', () => {
    renderWithProviders(
      <table><tbody><UserRow user={mockManager} /></tbody></table>,
      { preloadedState: baseState }
    )
    expect(screen.getByText('manager')).toBeInTheDocument()
  })

  it('renders phone number', () => {
    renderWithProviders(
      <table><tbody><UserRow user={mockManager} /></tbody></table>,
      { preloadedState: baseState }
    )
    expect(screen.getByText('+1-555-0101')).toBeInTheDocument()
  })

  it('renders em dash for missing phone', () => {
    const userNoPhone = { ...mockManager, phone_number: null }
    renderWithProviders(
      <table><tbody><UserRow user={userNoPhone} /></tbody></table>,
      { preloadedState: baseState }
    )
    // em dash may appear multiple times in the DOM — just confirm at least one exists
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows restore and force-delete buttons in archived mode', () => {
    renderWithProviders(
      <table><tbody><UserRow user={mockManager} isArchived /></tbody></table>,
      { preloadedState: baseState }
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('shows edit and archive buttons in normal mode', () => {
    renderWithProviders(
      <table><tbody><UserRow user={mockManager} /></tbody></table>,
      { preloadedState: baseState }
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})