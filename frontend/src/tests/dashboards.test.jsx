import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockAdmin, mockManager, mockEmployee, mockTask } from './helpers.jsx'
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import ManagerDashboard from '../pages/dashboard/ManagerDashboard'
import EmployeeDashboard from '../pages/dashboard/EmployeeDashboard'

vi.mock('../store/slices/usersSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchStats:       vi.fn(() => ({ type: 'users/stats/fulfilled',          payload: {} })),
    fetchMyEmployees: vi.fn(() => ({ type: 'users/fetchEmployees/fulfilled', payload: { data: [], meta: {} } })),
    fetchUsers:       vi.fn(() => ({ type: 'users/fetch/fulfilled',          payload: { data: [], meta: {} } })),
  }
})

vi.mock('../store/slices/tasksSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchTasks: vi.fn(() => ({ type: 'tasks/fetch/fulfilled', payload: { data: [], meta: {} } })),
  }
})

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

const adminStats = {
  total_managers: 3, total_employees: 12,
  total_tasks: 28, pending_tasks: 8, in_progress_tasks: 10, completed_tasks: 10,
}

const managerStats = {
  total_employees: 4, total_tasks: 10,
  pending_tasks: 3, in_progress_tasks: 4, completed_tasks: 3,
}

const employeeStats = {
  total_tasks: 5, pending_tasks: 1, in_progress_tasks: 2, completed_tasks: 2,
}

function makeState(user, stats, tasks = [], users = [], employees = []) {
  return {
    auth:  { user, token: 'tok', loading: false, initialized: true, error: null },
    tasks: { items: tasks, meta: null, loading: false, error: null, selectedTask: null },
    users: { items: users, employees, meta: null, employeesMeta: null, stats, loading: false, error: null },
    notifications: { items: [], meta: null, unreadCount: 0, loading: false, error: null },
    ui:    { darkMode: false, sidebarOpen: true, sidebarMobileOpen: false },
  }
}

// ── AdminDashboard ────────────────────────────────────────────────────────────

describe('AdminDashboard', () => {
  it('renders welcome message with admin name', () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, adminStats) })
    expect(screen.getByText(/Welcome back, Admin/i)).toBeInTheDocument()
  })

  it('renders all stat cards', () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, adminStats) })
    // Check stat card labels — these are unique text nodes
    expect(screen.getByText('Employees')).toBeInTheDocument()
    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    // 'Managers' and 'Pending' appear in both stat cards and sections — use getAllByText
    expect(screen.getAllByText('Managers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
  })

  it('displays correct stat values', () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, adminStats) })
    // Numbers may appear multiple times in DOM — use getAllByText
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)   // total_managers
    expect(screen.getAllByText('12').length).toBeGreaterThan(0)  // total_employees
    expect(screen.getAllByText('28').length).toBeGreaterThan(0)  // total_tasks
  })

  it('shows progress bar when there are tasks', () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, adminStats) })
    expect(screen.getByText('Overall Task Progress')).toBeInTheDocument()
  })

  it('does not show progress bar when no tasks', () => {
    const noTaskStats = { ...adminStats, total_tasks: 0 }
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, noTaskStats) })
    expect(screen.queryByText('Overall Task Progress')).not.toBeInTheDocument()
  })

  it('renders Recent Tasks section', () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, adminStats) })
    expect(screen.getByText('Recent Tasks')).toBeInTheDocument()
  })

  it('renders empty state when no tasks', () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, adminStats, []) })
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('renders Managers section', () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: makeState(mockAdmin, adminStats) })
    expect(screen.getAllByText('Managers').length).toBeGreaterThan(0)
  })

  it('shows task cards when tasks exist', () => {
    renderWithProviders(<AdminDashboard />, {
      preloadedState: makeState(mockAdmin, adminStats, [mockTask])
    })
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
  })

  it('shows manager in list when managers exist', () => {
    const manager = { ...mockManager, role: 'manager' }
    renderWithProviders(<AdminDashboard />, {
      preloadedState: makeState(mockAdmin, adminStats, [], [manager])
    })
    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument()
  })
})

// ── ManagerDashboard ──────────────────────────────────────────────────────────

describe('ManagerDashboard', () => {
  it('renders Manager Dashboard heading', () => {
    renderWithProviders(<ManagerDashboard />, { preloadedState: makeState(mockManager, managerStats) })
    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument()
  })

  it('renders New Task button', () => {
    renderWithProviders(<ManagerDashboard />, { preloadedState: makeState(mockManager, managerStats) })
    expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument()
  })

  it('renders employee count stat', () => {
    renderWithProviders(<ManagerDashboard />, { preloadedState: makeState(mockManager, managerStats) })
    expect(screen.getByText('My Employees')).toBeInTheDocument()
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
  })

  it('renders My Tasks section', () => {
    renderWithProviders(<ManagerDashboard />, { preloadedState: makeState(mockManager, managerStats) })
    expect(screen.getByText('My Tasks')).toBeInTheDocument()
  })

  it('renders My Team section', () => {
    renderWithProviders(<ManagerDashboard />, { preloadedState: makeState(mockManager, managerStats) })
    expect(screen.getByText('My Team')).toBeInTheDocument()
  })

  it('shows empty state with create task button when no tasks', () => {
    renderWithProviders(<ManagerDashboard />, { preloadedState: makeState(mockManager, managerStats, []) })
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('shows no employees message when team is empty', () => {
    renderWithProviders(<ManagerDashboard />, { preloadedState: makeState(mockManager, managerStats, [], [], []) })
    expect(screen.getByText('No employees yet')).toBeInTheDocument()
  })

  it('shows employee list when employees exist', () => {
    renderWithProviders(<ManagerDashboard />, {
      preloadedState: makeState(mockManager, managerStats, [], [], [mockEmployee])
    })
    expect(screen.getByText('Alex Turner')).toBeInTheDocument()
  })
})

// ── EmployeeDashboard ─────────────────────────────────────────────────────────

describe('EmployeeDashboard', () => {
  it('renders My Dashboard heading', () => {
    renderWithProviders(<EmployeeDashboard />, { preloadedState: makeState(mockEmployee, employeeStats) })
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
  })

  it('renders task stat cards', () => {
    renderWithProviders(<EmployeeDashboard />, { preloadedState: makeState(mockEmployee, employeeStats) })
    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows progress bar when stats available', () => {
    renderWithProviders(<EmployeeDashboard />, { preloadedState: makeState(mockEmployee, employeeStats) })
    expect(screen.getByText('Your Progress')).toBeInTheDocument()
  })

  it('shows empty state when no tasks', () => {
    renderWithProviders(<EmployeeDashboard />, {
      preloadedState: makeState(mockEmployee, { ...employeeStats, total_tasks: 0 }, [])
    })
    expect(screen.getByText('No tasks assigned yet')).toBeInTheDocument()
  })

  it('shows tasks grouped by status', () => {
    const pending    = { ...mockTask, id: 1, status: 'pending' }
    const inProgress = { ...mockTask, id: 2, status: 'in_progress' }
    const completed  = { ...mockTask, id: 3, status: 'completed' }
    renderWithProviders(<EmployeeDashboard />, {
      preloadedState: makeState(mockEmployee, employeeStats, [pending, inProgress, completed])
    })
    // Section headers use regex to avoid conflicts with badge text
    expect(screen.getByText(/In Progress \(\d+\)/)).toBeInTheDocument()
    expect(screen.getByText(/Pending \(\d+\)/)).toBeInTheDocument()
    expect(screen.getByText(/Completed \(\d+\)/)).toBeInTheDocument()
  })

  it('does not render New Task button for employee', () => {
    renderWithProviders(<EmployeeDashboard />, { preloadedState: makeState(mockEmployee, employeeStats) })
    expect(screen.queryByRole('button', { name: /new task/i })).not.toBeInTheDocument()
  })
})