import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

export const fetchUsers = createAsyncThunk('users/fetch', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users', { params })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch users')
  }
})

export const fetchMyEmployees = createAsyncThunk('users/fetchEmployees', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/my-employees', { params })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch employees')
  }
})

export const fetchStats = createAsyncThunk('users/stats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/stats')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats')
  }
})

export const createManager = createAsyncThunk('users/createManager', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users/managers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || 'Failed')
  }
})

export const createEmployee = createAsyncThunk('users/createEmployee', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || 'Failed')
  }
})

export const updateUser = createAsyncThunk('users/update', async (payload, { rejectWithValue }) => {
  // payload may be { hash_id, formData } or { id, formData }
  try {
    const hash_id = payload.hash_id ?? payload.id ?? payload
    const formData = payload.formData ?? payload.form ?? null
    const { data } = await api.post(`/users/${hash_id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || 'Failed')
  }
})

export const deleteUser = createAsyncThunk('users/delete', async (target, { rejectWithValue }) => {
  // target may be hash_id string or object { id, hash_id }
  try {
    const hash_id = target?.hash_id ?? target?.id ?? target
    await api.delete(`/users/${hash_id}`)
    return hash_id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

export const restoreUser = createAsyncThunk('users/restore', async (target, { rejectWithValue }) => {
  try {
    const hash_id = target?.hash_id ?? target?.id ?? target
    const { data } = await api.post(`/users/${hash_id}/restore`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

export const forceDeleteUser = createAsyncThunk('users/forceDelete', async (target, { rejectWithValue }) => {
  try {
    const hash_id = target?.hash_id ?? target?.id ?? target
    await api.delete(`/users/${hash_id}/force`)
    return hash_id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    employees: [],
    meta: null,
    employeesMeta: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => {
        state.loading = false
        state.items = payload.data
        state.meta = payload.meta
      })
      .addCase(fetchUsers.rejected, (state, { payload }) => { state.loading = false; state.error = payload })

      .addCase(fetchMyEmployees.fulfilled, (state, { payload }) => {
        state.employees = payload.data
        state.employeesMeta = payload.meta
      })

      .addCase(fetchStats.fulfilled, (state, { payload }) => { state.stats = payload })

      .addCase(createManager.fulfilled, (state, { payload }) => { state.items.unshift(payload) })
      .addCase(createEmployee.fulfilled, (state, { payload }) => {
        state.items.unshift(payload)
        state.employees.unshift(payload)
      })

      .addCase(updateUser.fulfilled, (state, { payload }) => {
        const update = (arr) => {
          const hash_idx = arr.findIndex(u => u.hash_id === payload.hash_id)
          if (hash_idx !== -1) arr[hash_idx] = payload
        }
        update(state.items)
        update(state.employees)
      })

      .addCase(deleteUser.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(u => u.hash_id !== payload)
        state.employees = state.employees.filter(u => u.hash_id !== payload)
      })

      .addCase(forceDeleteUser.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(u => u.hash_id !== payload)
      })
  },
})

export const { clearError } = usersSlice.actions
export default usersSlice.reducer
