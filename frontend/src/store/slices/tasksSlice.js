import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import { urlId } from '../../utils/id'

export const fetchTasks = createAsyncThunk('tasks/fetch', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks', { params })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch tasks')
  }
})

export const createTask = createAsyncThunk('tasks/create', async (taskData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/tasks', taskData)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || 'Failed to create task')
  }
})

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data: taskData } = {}, { rejectWithValue }) => {
  try {
    const resolvedId = urlId(id)
    const { data } = await api.patch(`/tasks/${resolvedId}`, taskData)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update task')
  }
})

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try {
    const resolvedId = urlId(id)
    await api.delete(`/tasks/${resolvedId}`)
    return resolvedId
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete task')
  }
})

export const restoreTask = createAsyncThunk('tasks/restore', async (id, { rejectWithValue }) => {
  try {
    const resolvedId = urlId(id)
    const { data } = await api.post(`/tasks/${resolvedId}/restore`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to restore task')
  }
})

export const forceDeleteTask = createAsyncThunk('tasks/forceDelete', async (id, { rejectWithValue }) => {
  try {
    const resolvedId = urlId(id)
    await api.delete(`/tasks/${resolvedId}/force`)
    return resolvedId
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to permanently delete task')
  }
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    meta: null,
    loading: false,
    error: null,
    selectedTask: null,
  },
  reducers: {
    setSelectedTask: (state, { payload }) => { state.selectedTask = payload },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchTasks.fulfilled, (state, { payload }) => {
        state.loading = false
        state.items = payload.data
        state.meta = payload.meta
      })
      .addCase(fetchTasks.rejected, (state, { payload }) => { state.loading = false; state.error = payload })

      .addCase(createTask.fulfilled, (state, { payload }) => {
        state.items.unshift(payload)
      })

      .addCase(updateTask.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(t => t.id === payload.id)
        if (idx !== -1) state.items[idx] = payload
        if (state.selectedTask?.id === payload.id) state.selectedTask = payload
      })

      .addCase(deleteTask.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(t => t.id !== payload)
      })

      .addCase(forceDeleteTask.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(t => t.id !== payload)
      })

      .addCase(restoreTask.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(t => t.id !== payload.id)
      })
  },
})

export const { setSelectedTask, clearError } = tasksSlice.actions
export default tasksSlice.reducer
