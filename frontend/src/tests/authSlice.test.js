import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  logout,
  clearError,
  loginUser,
  registerUser,
  logoutUser,
} from '../store/slices/authSlice'

// Mock axios
vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get:  vi.fn(),
  },
}))

import api from '../api/axios'

function makeStore(preloaded = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: preloaded },
  })
}

describe('authSlice — reducers', () => {
  it('logout clears user and token', () => {
    const store = makeStore({
      user: { id: 1, name: 'Admin' },
      token: 'abc123',
      initialized: true,
      loading: false,
      error: null,
    })

    store.dispatch(logout())

    const state = store.getState().auth
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('clearError sets error to null', () => {
    const store = makeStore({ error: 'Invalid credentials', loading: false, initialized: true, user: null, token: null })
    store.dispatch(clearError())
    expect(store.getState().auth.error).toBeNull()
  })
})

describe('authSlice — loginUser thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets user and token on successful login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user:  { id: 1, name: 'Admin', role: 'admin', email: 'admin@test.com' },
          token: 'sanctum-token-123',
        },
      },
    })

    const store = makeStore({ user: null, token: null, loading: false, initialized: false, error: null })
    await store.dispatch(loginUser({ email: 'admin@test.com', password: 'password' }))

    const state = store.getState().auth
    expect(state.user).not.toBeNull()
    expect(state.user.role).toBe('admin')
    expect(state.token).toBe('sanctum-token-123')
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets error on failed login', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    })

    const store = makeStore({ user: null, token: null, loading: false, initialized: false, error: null })
    await store.dispatch(loginUser({ email: 'wrong@test.com', password: 'bad' }))

    const state = store.getState().auth
    expect(state.user).toBeNull()
    expect(state.error).toBe('Invalid credentials')
    expect(state.loading).toBe(false)
  })

  it('sets loading to true while pending', () => {
    api.post.mockReturnValueOnce(new Promise(() => {})) // never resolves

    const store = makeStore({ user: null, token: null, loading: false, initialized: false, error: null })
    store.dispatch(loginUser({ email: 'a@b.com', password: 'x' }))

    expect(store.getState().auth.loading).toBe(true)
  })
})

describe('authSlice — registerUser thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('registers and sets user as admin when first user', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user:  { id: 1, name: 'First User', role: 'admin', email: 'first@test.com' },
          token: 'token-abc',
        },
      },
    })

    const store = makeStore({ user: null, token: null, loading: false, initialized: false, error: null })
    await store.dispatch(registerUser({
      name: 'First User', email: 'first@test.com',
      password: 'password123', password_confirmation: 'password123',
    }))

    const state = store.getState().auth
    expect(state.user.role).toBe('admin')
    expect(state.token).toBe('token-abc')
  })
})

describe('authSlice — logoutUser thunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('clears user and token on logout', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } })

    const store = makeStore({
      user: { id: 1, name: 'Admin', role: 'admin' },
      token: 'token-xyz',
      loading: false,
      initialized: true,
      error: null,
    })

    await store.dispatch(logoutUser())

    const state = store.getState().auth
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })
})
