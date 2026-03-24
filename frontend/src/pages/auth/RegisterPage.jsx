import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser, clearError } from '../../store/slices/authSlice'
import { Eye, EyeOff, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)

  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone_number: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(e => ({ ...e, [k]: '' }))
    dispatch(clearError())
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'At least 8 characters'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    const result = await dispatch(registerUser(form))
    if (!result.error) {
      toast.success('Account created!')
      navigate('/dashboard')
    } else if (typeof result.payload === 'object') {
      setFieldErrors(result.payload)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-primary mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Create account
        </h1>
        <p className="text-app-secondary text-sm">Get started with ITFlow today</p>
      </div>

      <div className="mb-5 p-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30 flex items-start gap-2">
        <Info size={14} className="text-primary-500 mt-0.5 shrink-0" />
        <p className="text-xs text-app-secondary leading-relaxed">
          The <strong className="text-app-primary">first registered user</strong> automatically becomes <strong className="text-app-primary">Admin</strong>. Subsequent users become employees by default.
        </p>
      </div>

      {error && typeof error === 'string' && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Full Name *</label>
          <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" autoComplete="name" />
          {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Email *</label>
          <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" autoComplete="email" />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Phone Number</label>
          <input className="input-field" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+1 555 0100" autoComplete="tel" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Password *</label>
          <div className="relative">
            <input
              className="input-field pr-10"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Confirm Password *</label>
          <input
            className="input-field"
            type="password"
            value={form.password_confirmation}
            onChange={e => set('password_confirmation', e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {fieldErrors.password_confirmation && <p className="text-red-500 text-xs mt-1">{fieldErrors.password_confirmation}</p>}
        </div>

        <button type="submit" className="btn-primary justify-center py-3 mt-1" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Creating account…
            </span>
          ) : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-app-secondary mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
