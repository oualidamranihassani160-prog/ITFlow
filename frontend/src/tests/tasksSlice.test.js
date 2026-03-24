import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import tasksReducer, {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  forceDeleteTask,
  setSelectedTask,
} from '../store/slices/tasksSlice'

vi.mock('../api/axios', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../api/axios'

const mockTask = {
  id: 1, title: 'Fix login bug', description: 'SSO broken',
  status: 'pending', priority: 'high',
  manager_id: 2, employee_id: 3,
  manager: { id: 2, name: 'Sarah' }, employee: { id: 3, name: 'Alex' },
}

function makeStore(preloaded = {}) {
  return configureStore({
    reducer: { tasks: tasksReducer },
    preloadedState: {
      tasks: { items: [], meta: null, loading: false, error: null, selectedTask: null, ...preloaded },
    },
  })
}

describe('tasksSlice — reducers', () => {
  it('setSelectedTask sets the selected task', () => {
    const store = makeStore()
    store.dispatch(setSelectedTask(mockTask))
    expect(store.getState().tasks.selectedTask).toEqual(mockTask)
  })

  it('setSelectedTask with null clears selection', () => {
    const store = makeStore({ selectedTask: mockTask })
    store.dispatch(setSelectedTask(null))
    expect(store.getState().tasks.selectedTask).toBeNull()
  })
})

describe('tasksSlice — fetchTasks thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('populates items on success', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [mockTask],
        meta: { total: 1, per_page: 15, current_page: 1, last_page: 1 },
      },
    })

    const store = makeStore()
    await store.dispatch(fetchTasks())

    const state = store.getState().tasks
    expect(state.items).toHaveLength(1)
    expect(state.items[0].title).toBe('Fix login bug')
    expect(state.meta.total).toBe(1)
    expect(state.loading).toBe(false)
  })

  it('sets error on failure', async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { message: 'Unauthorized' } },
    })

    const store = makeStore()
    await store.dispatch(fetchTasks())

    expect(store.getState().tasks.error).toBe('Unauthorized')
  })
})

describe('tasksSlice — createTask thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('prepends created task to items', async () => {
    const newTask = { ...mockTask, id: 2, title: 'New task' }
    api.post.mockResolvedValueOnce({ data: { success: true, data: newTask } })

    const store = makeStore({ items: [mockTask] })
    await store.dispatch(createTask({ title: 'New task', priority: 'low', employee_id: 3 }))

    const items = store.getState().tasks.items
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('New task') // prepended
  })
})

describe('tasksSlice — updateTask thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates task in items array', async () => {
    const updatedTask = { ...mockTask, status: 'completed' }
    api.patch.mockResolvedValueOnce({ data: { success: true, data: updatedTask } })

    const store = makeStore({ items: [mockTask] })
    await store.dispatch(updateTask({ id: 1, data: { status: 'completed' } }))

    expect(store.getState().tasks.items[0].status).toBe('completed')
  })

  it('updates selectedTask if it matches', async () => {
    const updatedTask = { ...mockTask, status: 'in_progress' }
    api.patch.mockResolvedValueOnce({ data: { success: true, data: updatedTask } })

    const store = makeStore({ items: [mockTask], selectedTask: mockTask })
    await store.dispatch(updateTask({ id: 1, data: { status: 'in_progress' } }))

    expect(store.getState().tasks.selectedTask.status).toBe('in_progress')
  })
})

describe('tasksSlice — deleteTask thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes task from items on soft delete', async () => {
    api.delete.mockResolvedValueOnce({ data: { success: true } })

    const store = makeStore({ items: [mockTask] })
    await store.dispatch(deleteTask(1))

    expect(store.getState().tasks.items).toHaveLength(0)
  })
})

describe('tasksSlice — forceDeleteTask thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes task from items on force delete', async () => {
    api.delete.mockResolvedValueOnce({ data: { success: true } })

    const store = makeStore({ items: [mockTask] })
    await store.dispatch(forceDeleteTask(1))

    expect(store.getState().tasks.items).toHaveLength(0)
  })
})
