import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockAdmin, mockManager, mockEmployee } from './helpers.jsx'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

vi.mock('../store/slices/authSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loginUser:    vi.fn(() => ({ type: 'auth/login/fulfilled',    payload: { user: mockAdmin, token: 'tok' } })),
    registerUser: vi.fn(() => ({ type: 'auth/register/fulfilled', payload: { user: mockAdmin, token: 'tok' } })),
    clearError:   actual.clearError,
  }
})

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

// ── LoginPage ─────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })

    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders Sign In button', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty form', async () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('shows password required error', async () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), {
      target: { value: 'test@test.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('shows API error message', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: { user: null, token: null, loading: false, initialized: true, error: 'Invalid credentials' },
      },
    })
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('shows loading state on submit', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, token: null, loading: true, initialized: true, error: null } },
    })
    expect(screen.getByText('Signing in…')).toBeInTheDocument()
  })

  it('renders demo account buttons', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Manager')).toBeInTheDocument()
    expect(screen.getByText('Employee')).toBeInTheDocument()
  })

  it('fills email when demo button is clicked', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })

    fireEvent.click(screen.getByText('Admin'))
    const emailInput = screen.getByPlaceholderText('you@company.com')
    expect(emailInput.value).toBe('admin@itflow.com')
  })
})

// ── RegisterPage ──────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
  it('renders all form fields', () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })

    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Min 8 characters')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('shows first-user admin notice', () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })
    expect(screen.getByText(/first registered user/i)).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows password mismatch error', async () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'John' } })
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'j@t.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'different123' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('has a link to login page', () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: { auth: { user: null, token: null, loading: false, initialized: true, error: null } },
    })
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})
