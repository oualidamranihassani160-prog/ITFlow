import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockManager, mockEmployee, mockTask } from './helpers.jsx'
import TaskForm from '../components/tasks/TaskForm'

vi.mock('../store/slices/tasksSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createTask: vi.fn(() => ({ type: 'tasks/create/fulfilled', payload: mockTask })),
    updateTask: vi.fn(() => ({ type: 'tasks/update/fulfilled', payload: mockTask })),
  }
})

vi.mock('../store/slices/usersSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchMyEmployees: vi.fn(() => ({
      type: 'users/fetchEmployees/fulfilled',
      payload: { data: [mockEmployee], meta: {} },
    })),
    fetchUsers: vi.fn(() => ({
      type: 'users/fetch/fulfilled',
      payload: { data: [mockEmployee], meta: {} },
    })),
  }
})

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

const baseState = {
  auth:  { user: mockManager, token: 'tok', loading: false, initialized: true, error: null },
  tasks: { items: [], meta: null, loading: false, error: null, selectedTask: null },
  users: {
    items: [mockEmployee],
    employees: [mockEmployee],
    meta: null, employeesMeta: null, stats: null, loading: false, error: null,
  },
  notifications: { items: [], meta: null, unreadCount: 0, loading: false, error: null },
  ui: { darkMode: false, sidebarOpen: true, sidebarMobileOpen: false },
}

// ── Create mode ───────────────────────────────────────────────────────────────

describe('TaskForm — create mode', () => {
  const onClose = vi.fn()
  beforeEach(() => vi.clearAllMocks())

  it('renders title field', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByPlaceholderText('Task title…')).toBeInTheDocument()
  })

  it('renders description field', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByPlaceholderText('Task details…')).toBeInTheDocument()
  })

  it('renders Create Task button', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByText('Create Task')).toBeInTheDocument()
  })

  it('renders priority select with default medium', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByDisplayValue('🟡 Medium')).toBeInTheDocument()
  })

  it('renders employee dropdown label', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByText('Assign To *')).toBeInTheDocument()
  })

  it('shows employee name in dropdown', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByText('Alex Turner')).toBeInTheDocument()
  })

  it('shows title required error on empty submit', async () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    fireEvent.click(screen.getByText('Create Task'))
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('shows employee required error when no employee selected', async () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    fireEvent.change(screen.getByPlaceholderText('Task title…'), { target: { value: 'My Task' } })
    fireEvent.click(screen.getByText('Create Task'))
    await waitFor(() => {
      expect(screen.getByText('Please select an employee')).toBeInTheDocument()
    })
  })

  it('calls onClose when Cancel is clicked', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not show employee dropdown for employee role', () => {
    const employeeState = {
      ...baseState,
      auth: { user: mockEmployee, token: 'tok', loading: false, initialized: true, error: null },
    }
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: employeeState })
    expect(screen.queryByText('Assign To *')).not.toBeInTheDocument()
  })

  it('renders all three priority options', () => {
    renderWithProviders(<TaskForm onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByText('🟢 Low')).toBeInTheDocument()
    expect(screen.getByText('🟡 Medium')).toBeInTheDocument()
    expect(screen.getByText('🔴 High')).toBeInTheDocument()
  })
})

// ── Edit mode ─────────────────────────────────────────────────────────────────

describe('TaskForm — edit mode', () => {
  const onClose = vi.fn()
  beforeEach(() => vi.clearAllMocks())

  it('pre-fills title field', () => {
    renderWithProviders(<TaskForm task={mockTask} onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByDisplayValue('Fix login bug')).toBeInTheDocument()
  })

  it('pre-fills description field', () => {
    renderWithProviders(<TaskForm task={mockTask} onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByDisplayValue('Users cannot login with SSO')).toBeInTheDocument()
  })

  it('shows Update Task button instead of Create Task', () => {
    renderWithProviders(<TaskForm task={mockTask} onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByText('Update Task')).toBeInTheDocument()
    expect(screen.queryByText('Create Task')).not.toBeInTheDocument()
  })

  it('pre-selects the correct priority', () => {
    renderWithProviders(<TaskForm task={mockTask} onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByDisplayValue('🔴 High')).toBeInTheDocument()
  })

  it('pre-fills due date', () => {
    renderWithProviders(<TaskForm task={mockTask} onClose={onClose} />, { preloadedState: baseState })
    expect(screen.getByDisplayValue('2026-04-01')).toBeInTheDocument()
  })
})