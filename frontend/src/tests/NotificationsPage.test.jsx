import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockEmployee, mockManager, mockNotification } from './helpers.jsx'
import NotificationsPage from '../pages/NotificationsPage'

vi.mock('../store/slices/notificationsSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchNotifications: vi.fn(() => ({ type: 'notifications/fetch/fulfilled', payload: { data: [], meta: {} } })),
    markAsRead:         vi.fn(() => ({ type: 'notifications/markRead/fulfilled', payload: { ...mockNotification, is_read: true } })),
    markAllAsRead:      vi.fn(() => ({ type: 'notifications/markAllRead/fulfilled', payload: true })),
    deleteNotification: vi.fn(() => ({ type: 'notifications/delete/fulfilled', payload: mockNotification.id })),
  }
})

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

function makeState(notifications = [], unreadCount = 0, user = mockEmployee) {
  return {
    auth:  { user, token: 'tok', loading: false, initialized: true, error: null },
    tasks: { items: [], meta: null, loading: false, error: null, selectedTask: null },
    users: { items: [], employees: [], meta: null, employeesMeta: null, stats: null, loading: false, error: null },
    notifications: { items: notifications, meta: null, unreadCount, loading: false, error: null },
    ui:    { darkMode: false, sidebarOpen: true, sidebarMobileOpen: false },
  }
}

describe('NotificationsPage', () => {
  it('renders Notifications heading', () => {
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState() })
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([], 0) })
    expect(screen.getByText('No notifications yet')).toBeInTheDocument()
  })

  it('does not show Mark all read button when no unread', () => {
    const readNotif = { ...mockNotification, is_read: true }
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([readNotif], 0) })
    expect(screen.queryByRole('button', { name: /mark all read/i })).not.toBeInTheDocument()
  })

  it('shows Mark all read button when unread notifications exist', () => {
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([mockNotification], 1) })
    expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument()
  })

  it('shows unread count', () => {
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([mockNotification], 1) })
    expect(screen.getByText('1 unread')).toBeInTheDocument()
  })

  it('renders notification message', () => {
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([mockNotification], 1) })
    expect(screen.getByText(mockNotification.message)).toBeInTheDocument()
  })

  it('renders correct icon for task_assigned type', () => {
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([mockNotification], 1) })
    expect(screen.getByText('📋')).toBeInTheDocument()
  })

  it('renders correct icon for task_completed type', () => {
    const completedNotif = { ...mockNotification, type: 'task_completed', message: 'Task was completed' }
    renderWithProviders(<NotificationsPage />, {
      preloadedState: makeState([completedNotif], 1, mockManager),
    })
    expect(screen.getByText('✅')).toBeInTheDocument()
  })

  it('shows read notification without unread indicator dot', () => {
    const readNotif = { ...mockNotification, is_read: true, read_at: '2026-03-21T12:00:00Z' }
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([readNotif], 0) })
    const dots = document.querySelectorAll('.w-2.h-2.rounded-full.bg-primary-500')
    expect(dots.length).toBe(0)
  })

  it('shows unread dot for unread notification', () => {
    renderWithProviders(<NotificationsPage />, { preloadedState: makeState([mockNotification], 1) })
    const dots = document.querySelectorAll('.w-2.h-2.rounded-full.bg-primary-500')
    expect(dots.length).toBeGreaterThan(0)
  })

  it('renders multiple notifications', () => {
    const notif2 = { ...mockNotification, id: 2, message: 'Second notification' }
    renderWithProviders(<NotificationsPage />, {
      preloadedState: makeState([mockNotification, notif2], 2),
    })
    expect(screen.getByText(mockNotification.message)).toBeInTheDocument()
    expect(screen.getByText('Second notification')).toBeInTheDocument()
  })
})