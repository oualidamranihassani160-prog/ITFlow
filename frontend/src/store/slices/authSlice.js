import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

// Thunks
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('itflow_token', data.data.token)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('itflow_token', data.data.token)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || 'Registration failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user')
  }
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.errors || err.response?.data?.message || 'Update failed')
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout') } catch {}
  localStorage.removeItem('itflow_token')
})

export const deleteAvatar = createAsyncThunk('auth/deleteAvatar', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.delete('/auth/avatar')
        return data.data
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to remove avatar.')
    }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('itflow_token'),
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.initialized = true
      localStorage.removeItem('itflow_token')
    },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    // login
    builder.addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(loginUser.fulfilled, (state, { payload }) => {
      state.loading = false
      state.user = payload.user
      state.token = payload.token
      state.initialized = true
    })
    builder.addCase(loginUser.rejected, (state, { payload }) => {
      state.loading = false
      state.error = payload
      state.initialized = true
    })

    // register
    builder.addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(registerUser.fulfilled, (state, { payload }) => {
      state.loading = false
      state.user = payload.user
      state.token = payload.token
      state.initialized = true
    })
    builder.addCase(registerUser.rejected, (state, { payload }) => {
      state.loading = false
      state.error = payload
      state.initialized = true
    })

    // fetchMe
    builder.addCase(fetchMe.pending, (state) => { state.loading = true })
    builder.addCase(fetchMe.fulfilled, (state, { payload }) => {
      state.loading = false
      state.user = payload
      state.initialized = true
    })
    builder.addCase(fetchMe.rejected, (state) => {
      state.loading = false
      state.user = null
      state.token = null
      state.initialized = true
      localStorage.removeItem('itflow_token')
    })

    // updateProfile
    builder.addCase(updateProfile.fulfilled, (state, { payload }) => {
      state.user = payload
    })

    // logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null
      state.token = null
      state.initialized = true
    })

    // delete avatar
    builder.addCase(deleteAvatar.fulfilled, (state, { payload }) => {
    state.user = payload
})
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
