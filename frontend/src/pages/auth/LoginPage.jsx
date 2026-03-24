import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, clearError } from '../../store/slices/authSlice'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(e => ({ ...e, [k]: '' }))
    dispatch(clearError())
  }

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    const result = await dispatch(loginUser(form))
    if (!result.error) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    }
  }

  const demoLogin = (email) => {
    setForm({ email, password: 'password' })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-primary mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Welcome back
        </h1>
        <p className="text-app-secondary text-sm">Sign in to your ITFlow account</p>
      </div>

      {/* Demo accounts */}
      <div className="mb-6 p-4 rounded-xl border border-app bg-primary-50/50 dark:bg-primary-950/30">
        <p className="text-xs font-semibold text-app-secondary mb-2">Demo accounts (password: <code className="font-mono bg-white/60 dark:bg-black/20 px-1 py-0.5 rounded">password</code>)</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Admin', email: 'admin@itflow.com' },
            { label: 'Manager1', email: 'sarah.mitchell@itflow.com' },
            { label: 'Manager2', email: 'james.carter@itflow.com' },
            { label: 'Employee1', email: 'employee1@itflow.com' },
            { label: 'Employee2', email: 'employee2@itflow.com' },
          ].map(({ label, email }) => (
            <button key={label} type="button" onClick={() => demoLogin(email)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: 'rgba(8,131,149,0.1)', color: '#088395', border: '1px solid rgba(8,131,149,0.2)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Email</label>
          <input
            className="input-field"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Password</label>
          <div className="relative">
            <input
              className="input-field pr-10"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary transition-colors">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
        </div>

        <button type="submit" className="btn-primary justify-center py-3 mt-2" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Signing in…
            </span>
          ) : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-app-secondary mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
