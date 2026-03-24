import { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Upload, User, Mail, Phone, Shield, X } from 'lucide-react'
import { updateProfile, deleteAvatar } from '../store/slices/authSlice'
import { RoleBadge } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(user?.avatar || null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate password change
    if (form.password && !form.current_password) {
      setErrors({ current_password: 'Current password required' }); return
    }
    if (form.password && form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' }); return
    }

    setLoading(true)
    const fd = new FormData()
    if (form.name !== user?.name) fd.append('name', form.name)
    if (form.email !== user?.email) fd.append('email', form.email)
    if (form.phone_number !== user?.phone_number) fd.append('phone_number', form.phone_number)
    if (form.current_password) fd.append('current_password', form.current_password)
    if (form.password) { fd.append('password', form.password); fd.append('password_confirmation', form.password_confirmation) }
    if (avatar) fd.append('avatar', avatar)

    const result = await dispatch(updateProfile(fd))
    setLoading(false)

    if (!result.error) {
      toast.success('Profile updated!')
      setForm(f => ({ ...f, current_password: '', password: '', password_confirmation: '' }))
    } else {
      const err = result.payload
      if (typeof err === 'object') setErrors(err)
      else toast.error(typeof err === 'string' ? err : 'Update failed')
    }
  }
  const handleDeleteAvatar = async () => {
    const result = await dispatch(deleteAvatar())
    if (!result.error) {
        setPreview(null)
        setAvatar(null)
        toast.success('Avatar removed.')
    } else {
        toast.error(result.payload || 'Failed to remove avatar.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>Profile Settings</h1>
        <p className="text-app-secondary text-sm mt-0.5">Manage your account information</p>
      </div>

      {/* Avatar section */}
      <div className="card p-6 flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            {/* Avatar image */}
            <div className="cursor-pointer" onClick={() => fileRef.current?.click()}>
                {preview ? (
                    <img src={preview} alt={user?.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                    <Avatar src={user?.avatar} name={user?.name} size="xl" />
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    <Upload size={20} className="text-white" />
                </div>
            </div>

            {/* Delete X button — only shown when avatar exists */}
            {(preview || user?.avatar) && (
                <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
                    title="Remove avatar"
                >
                    <X size={12} />
                </button>
            )}
          </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <p className="text-xs text-app-muted">Click to upload · Max 2MB</p>
    </div>
        <div>
          <h3 className="text-lg font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.name}</h3>
          <p className="text-app-muted text-sm">{user?.email}</p>
          <div className="mt-2">
            <RoleBadge role={user?.role} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Personal info */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-app-primary mb-4 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            <User size={16} className="text-primary-500" /> Personal Information
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5">Full Name</label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5">Phone Number</label>
              <input className="input-field" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+1 555 0100" />
            </div>
              {/* Salary — read only for employee and manager */}
              {(user?.role === 'employee' || user?.role === 'manager') && (
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-app-secondary mb-1.5">
                              Salary
                          </label>
                          <div className="input-field bg-primary-50 dark:bg-primary-950/30 cursor-not-allowed flex items-center justify-between">
                              <span className={user?.salary ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-app-muted'}>
                                  {user?.salary
                                      ? `${Number(user.salary).toLocaleString('fr-MA')} MAD`
                                      : 'Not set'
                                  }
                              </span>
                              {user?.salary && (
                                  <span className="text-xs text-app-muted font-medium">MAD</span>
                              )}
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-app-secondary mb-1.5">
                              Hire Date
                          </label>
                          <div className="input-field bg-primary-50 dark:bg-primary-950/30 cursor-not-allowed text-app-secondary">
                              {user?.hire_date
                                  ? new Date(user.hire_date).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'long', day: 'numeric'
                                    })
                                  : <span className="text-app-muted">Not set</span>
                              }
                          </div>
                      </div>
                  </div>
              )}
          </div>
        </div>


        {/* Password */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-app-primary mb-4 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            <Shield size={16} className="text-primary-500" /> Change Password
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5">Current Password</label>
              <input className="input-field" type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)} placeholder="Enter current password" />
              {errors.current_password && <p className="text-red-500 text-xs mt-1">{errors.current_password}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1.5">New Password</label>
                <input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1.5">Confirm Password</label>
                <input className="input-field" type="password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} placeholder="Repeat password" />
                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
