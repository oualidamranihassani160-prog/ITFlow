import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { createTestStore } from './helpers.jsx'
import PrivateRoute from '../components/guards/PrivateRoute'
import RoleRoute from '../components/guards/RoleRoute'

function renderWithStore(ui, state) {
  const store = createTestStore(state)
  return render(<Provider store={store}>{ui}</Provider>)
}

const authState = (user, token) => ({
  auth:  { user, token, loading: false, initialized: true, error: null },
  tasks: { items: [], meta: null, loading: false, error: null, selectedTask: null },
  users: { items: [], employees: [], meta: null, employeesMeta: null, stats: null, loading: false, error: null },
  notifications: { items: [], meta: null, unreadCount: 0, loading: false, error: null },
  ui:    { darkMode: false, sidebarOpen: true, sidebarMobileOpen: false },
})

// ── PrivateRoute ──────────────────────────────────────────────────────────────

describe('PrivateRoute', () => {
  it('renders children when user is authenticated', () => {
    const user = { id: 1, name: 'Admin', role: 'admin' }
    renderWithStore(
      <MemoryRouter>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </MemoryRouter>,
      authState(user, 'tok123')
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    renderWithStore(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div>Dashboard</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
      authState(null, null)
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})

// ── RoleRoute ─────────────────────────────────────────────────────────────────

describe('RoleRoute', () => {
  it('renders outlet when user has correct role', () => {
    const adminUser = { id: 1, name: 'Admin', role: 'admin' }
    renderWithStore(
      <MemoryRouter>
        <Routes>
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      authState(adminUser, 'tok')
    )
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('redirects when user does not have required role', () => {
    const employeeUser = { id: 3, name: 'Alex', role: 'employee' }
    renderWithStore(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<div>Admin Only</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      authState(employeeUser, 'tok')
    )
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('allows access for manager when role includes manager', () => {
    const managerUser = { id: 2, name: 'Sarah', role: 'manager' }
    renderWithStore(
      <MemoryRouter>
        <Routes>
          <Route element={<RoleRoute roles={['admin', 'manager']} />}>
            <Route path="/" element={<div>Manager Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      authState(managerUser, 'tok')
    )
    expect(screen.getByText('Manager Content')).toBeInTheDocument()
  })

  it('redirects to /login when user is null', () => {
    renderWithStore(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<div>Admin Only</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      authState(null, null)
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
