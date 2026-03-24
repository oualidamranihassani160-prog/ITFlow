import React from 'react'
import { render } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import authReducer from '../store/slices/authSlice'
import tasksReducer from '../store/slices/tasksSlice'
import usersReducer from '../store/slices/usersSlice'
import notificationsReducer from '../store/slices/notificationsSlice'
import uiReducer from '../store/slices/uiSlice'

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth:          authReducer,
      tasks:         tasksReducer,
      users:         usersReducer,
      notifications: notificationsReducer,
      ui:            uiReducer,
    },
    preloadedState,
  })
}

export function renderWithProviders(ui, { preloadedState = {}, route = '/' } = {}) {
  const store = createTestStore(preloadedState)

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper }) }
}

// Mock users
export const mockAdmin = {
  id: 1, name: 'Admin User', email: 'admin@test.com',
  role: 'admin', avatar: null, phone_number: null,
}

export const mockManager = {
  id: 2, name: 'Sarah Mitchell', email: 'sarah@test.com',
  role: 'manager', avatar: null, phone_number: '+1-555-0101',
}

export const mockEmployee = {
  id: 3, name: 'Alex Turner', email: 'alex@test.com',
  role: 'employee', manager_id: 2, avatar: null, phone_number: null,
}

export const mockTask = {
  id: 1,
  title: 'Fix login bug',
  description: 'Users cannot login with SSO',
  status: 'pending',
  priority: 'high',
  due_date: '2026-04-01',
  manager_id: 2,
  employee_id: 3,
  manager: { id: 2, name: 'Sarah Mitchell', avatar: null },
  employee: { id: 3, name: 'Alex Turner', avatar: null },
  created_at: '2026-03-01T10:00:00Z',
}

export const mockNotification = {
  id: 1,
  type: 'task_assigned',
  message: 'You have been assigned a new task: "Fix login bug"',
  data: { task_id: 1, task_title: 'Fix login bug' },
  is_read: false,
  read_at: null,
  created_at: '2026-03-01T10:00:00Z',
}
