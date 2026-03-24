import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockTask, mockManager, mockEmployee } from './helpers.jsx'
import TaskCard from '../components/tasks/TaskCard'

vi.mock('../store/slices/tasksSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    updateTask: vi.fn(() => ({ type: 'tasks/update/fulfilled', payload: mockTask })),
    deleteTask: vi.fn(() => ({ type: 'tasks/delete/fulfilled', payload: mockTask.id })),
  }
})

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

function makeState(user) {
  return {
    auth:  { user, token: 'tok', loading: false, initialized: true, error: null },
    tasks: { items: [mockTask], meta: null, loading: false, error: null, selectedTask: null },
    users: { items: [], employees: [], meta: null, employeesMeta: null, stats: null, loading: false, error: null },
    notifications: { items: [], meta: null, unreadCount: 0, loading: false, error: null },
    ui:    { darkMode: false, sidebarOpen: true, sidebarMobileOpen: false },
  }
}

describe('TaskCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders task title', () => {
    renderWithProviders(<TaskCard task={mockTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
  })

  it('renders task description', () => {
    renderWithProviders(<TaskCard task={mockTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('Users cannot login with SSO')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    renderWithProviders(<TaskCard task={mockTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders priority badge', () => {
    renderWithProviders(<TaskCard task={mockTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('renders assigned employee name', () => {
    renderWithProviders(<TaskCard task={mockTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('Alex Turner')).toBeInTheDocument()
  })

  it('renders due date when present', () => {
    renderWithProviders(<TaskCard task={mockTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText(/Apr 1, 2026/)).toBeInTheDocument()
  })

  it('does not render due date when absent', () => {
    const taskNoDue = { ...mockTask, due_date: null }
    renderWithProviders(<TaskCard task={taskNoDue} />, { preloadedState: makeState(mockManager) })
    expect(screen.queryByText(/Apr 1/)).not.toBeInTheDocument()
  })

  it('shows context menu when menu button clicked', async () => {
    renderWithProviders(<TaskCard task={mockTask} />, { preloadedState: makeState(mockManager) })
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    await waitFor(() => {
      expect(screen.getByText('Edit task')).toBeInTheDocument()
    })
  })

  it('renders completed task with correct badge', () => {
    const completedTask = { ...mockTask, status: 'completed' }
    renderWithProviders(<TaskCard task={completedTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders in_progress task with correct badge', () => {
    const inProgressTask = { ...mockTask, status: 'in_progress' }
    renderWithProviders(<TaskCard task={inProgressTask} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('employee sees status options in menu', async () => {
    const taskForEmployee = { ...mockTask, employee_id: mockEmployee.id }
    renderWithProviders(<TaskCard task={taskForEmployee} />, { preloadedState: makeState(mockEmployee) })
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    await waitFor(() => {
      expect(screen.getByText('Mark In Progress')).toBeInTheDocument()
    })
  })

  it('renders task without description gracefully', () => {
    const taskNoDesc = { ...mockTask, description: null }
    renderWithProviders(<TaskCard task={taskNoDesc} />, { preloadedState: makeState(mockManager) })
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
  })
})