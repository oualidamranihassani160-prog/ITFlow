import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import notificationsReducer, {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../store/slices/notificationsSlice'

vi.mock('../api/axios', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../api/axios'

const mockNotif = {
  id: 1, type: 'task_assigned',
  message: 'You have been assigned: Fix login',
  data: { task_id: 1 }, is_read: false, read_at: null,
  created_at: '2026-03-01T10:00:00Z',
}

function makeStore(preloaded = {}) {
  return configureStore({
    reducer: { notifications: notificationsReducer },
    preloadedState: {
      notifications: {
        items: [], meta: null, unreadCount: 0,
        loading: false, error: null,
        ...preloaded,
      },
    },
  })
}

describe('notificationsSlice — fetchNotifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('populates items and unread count', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [mockNotif],
        meta: { total: 1, per_page: 20, current_page: 1, last_page: 1, unread_count: 1 },
      },
    })

    const store = makeStore()
    await store.dispatch(fetchNotifications())

    const state = store.getState().notifications
    expect(state.items).toHaveLength(1)
    expect(state.unreadCount).toBe(1)
  })
})

describe('notificationsSlice — markAsRead', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks notification as read and decrements unreadCount', async () => {
    const readNotif = { ...mockNotif, is_read: true, read_at: '2026-03-21T12:00:00Z' }
    api.patch.mockResolvedValueOnce({ data: { success: true, data: readNotif } })

    const store = makeStore({ items: [mockNotif], unreadCount: 1 })
    await store.dispatch(markAsRead(1))

    const state = store.getState().notifications
    expect(state.items[0].is_read).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('does not go below 0 for unreadCount', async () => {
    const readNotif = { ...mockNotif, is_read: true, read_at: '2026-03-21T12:00:00Z' }
    api.patch.mockResolvedValueOnce({ data: { success: true, data: readNotif } })

    const store = makeStore({ items: [mockNotif], unreadCount: 0 })
    await store.dispatch(markAsRead(1))

    expect(store.getState().notifications.unreadCount).toBe(0)
  })
})

describe('notificationsSlice — markAllAsRead', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks all items as read and zeroes unreadCount', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } })

    const store = makeStore({
      items: [
        { ...mockNotif, id: 1, is_read: false },
        { ...mockNotif, id: 2, is_read: false },
      ],
      unreadCount: 2,
    })

    await store.dispatch(markAllAsRead())

    const state = store.getState().notifications
    expect(state.unreadCount).toBe(0)
    state.items.forEach(n => expect(n.is_read).toBe(true))
  })
})

describe('notificationsSlice — deleteNotification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes notification from items', async () => {
    api.delete.mockResolvedValueOnce({ data: { success: true } })

    const store = makeStore({ items: [mockNotif], unreadCount: 1 })
    await store.dispatch(deleteNotification(1))

    expect(store.getState().notifications.items).toHaveLength(0)
  })

  it('decrements unreadCount when deleting unread notification', async () => {
    api.delete.mockResolvedValueOnce({ data: { success: true } })

    const store = makeStore({ items: [mockNotif], unreadCount: 1 })
    await store.dispatch(deleteNotification(1))

    expect(store.getState().notifications.unreadCount).toBe(0)
  })

  it('does not decrement unreadCount when deleting read notification', async () => {
    api.delete.mockResolvedValueOnce({ data: { success: true } })
    const readNotif = { ...mockNotif, is_read: true }

    const store = makeStore({ items: [readNotif], unreadCount: 0 })
    await store.dispatch(deleteNotification(1))

    expect(store.getState().notifications.unreadCount).toBe(0)
  })
})
