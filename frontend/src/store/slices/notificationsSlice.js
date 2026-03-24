import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import { urlId } from '../../utils/id'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications', { params })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    const rid = urlId(id)
    const { data } = await api.patch(`/notifications/${rid}/read`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await api.post('/notifications/read-all')
    return true
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

export const deleteNotification = createAsyncThunk('notifications/delete', async (id, { rejectWithValue }) => {
  try {
    const rid = urlId(id)
    await api.delete(`/notifications/${rid}`)
    return rid
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    meta: null,
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading = false
        state.items = payload.data
        state.meta = payload.meta
        state.unreadCount = payload.meta?.unread_count ?? 0
      })
      .addCase(fetchNotifications.rejected, (state, { payload }) => { state.loading = false; state.error = payload })

      .addCase(markAsRead.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(n => n.id === payload.id)
        if (idx !== -1) state.items[idx] = payload
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      })

      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items = state.items.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        state.unreadCount = 0
      })

      .addCase(deleteNotification.fulfilled, (state, { payload }) => {
        const n = state.items.find(n => n.id === payload)
        if (n && !n.is_read) state.unreadCount = Math.max(0, state.unreadCount - 1)
        state.items = state.items.filter(n => n.id !== payload)
      })
  },
})

export default notificationsSlice.reducer
