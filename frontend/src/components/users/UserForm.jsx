import { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { createManager, createEmployee, updateUser } from '../../store/slices/usersSlice'
import { Upload, User } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPLOYMENT_TYPES = [
    { value: '', label: 'Select type…' },
    { value: 'full_time',   label: 'Full Time' },
    { value: 'part_time',   label: 'Part Time' },
    { value: 'contract',    label: 'Contract' },
    { value: 'internship',  label: 'Internship' },
]

const CONTRACT_TYPES = [
    { value: '', label: 'Select type…' },
    { value: 'CDI',        label: 'CDI' },
    { value: 'CDD',        label: 'CDD' },
    { value: 'freelance',  label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
]

export default function UserForm({ user, role = 'manager', onClose }) {
    const dispatch = useDispatch()
    const fileRef  = useRef(null)

    const [form, setForm] = useState({
        name:                 user?.name                 || '',
        email:                user?.email                || '',
        password:             '',
        phone_number:         user?.phone_number         || '',
        job_title:            user?.job_title            || '',
        employment_type:      user?.employment_type      || '',
        address:              user?.address              || '',
        national_id:          user?.national_id          || '',
        date_of_birth:        user?.date_of_birth        || '',
        education_level:      user?.education_level      || '',
        field_of_study:       user?.field_of_study       || '',
        university:           user?.university           || '',
        certifications:       user?.certifications       || '',
        years_of_experience:  user?.years_of_experience  || '',
        linkedin_url:         user?.linkedin_url         || '',
        github_url:           user?.github_url           || '',
        contract_type:        user?.contract_type        || '',
        contract_start_date:  user?.contract_start_date  || '',
        contract_end_date:    user?.contract_end_date    || '',
        salary:               user?.salary               || '',
        hire_date:            user?.hire_date            || '',
    })

    const [avatar, setAvatar]   = useState(null)
    const [preview, setPreview] = useState(user?.avatar || null)
    const [errors, setErrors]   = useState({})
    const [loading, setLoading] = useState(false)

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setAvatar(file)
        setPreview(URL.createObjectURL(file))
    }

    const validate = () => {
        const e = {}
        if (!form.name.trim())  e.name  = 'Name is required'
        if (!form.email.trim()) e.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
        if (!user && !form.password)          e.password = 'Password is required'
        if (!user && form.password?.length < 8 && form.password) e.password = 'Minimum 8 characters'
        if (form.salary && isNaN(Number(form.salary))) e.salary = 'Must be a number'
        if (form.years_of_experience && isNaN(Number(form.years_of_experience))) e.years_of_experience = 'Must be a number'
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        setLoading(true)
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
        if (avatar) fd.append('avatar', avatar)

        let result
        if (user) {
            // send hashed id (hash_id) when available
            result = await dispatch(updateUser({ hash_id: user.hash_id ?? user.id, formData: fd }))
        } else if (role === 'manager') {
            result = await dispatch(createManager(fd))
        } else {
            result = await dispatch(createEmployee(fd))
        }

        setLoading(false)
        if (result.error) {
            const err = result.payload
            if (typeof err === 'object') setErrors(err)
            else toast.error(typeof err === 'string' ? err : 'Something went wrong')
        } else {
            toast.success(user ? 'User updated!' : `${role === 'manager' ? 'Manager' : 'Employee'} created!`)
            onClose()
        }
    }

    const field = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1.5">{label}</label>
            <input className="input-field" type={type} value={form[key]}
                onChange={e => set(key, e.target.value)} placeholder={placeholder} />
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
        </div>
    )

    const select = (label, key, options) => (
        <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1.5">{label}</label>
            <select className="input-field" value={form[key]} onChange={e => set(key, e.target.value)}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* ── Avatar ── */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden border-2 border-dashed border-app hover:border-primary-400 transition-colors"
                    style={{ background: preview ? 'transparent' : 'var(--bg-app)' }}
                    onClick={() => fileRef.current?.click()}>
                    {preview
                        ? <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        : <div className="flex flex-col items-center gap-1 text-app-muted"><User size={24} /><span className="text-xs">Photo</span></div>
                    }
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload size={20} className="text-white" />
                    </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <p className="text-xs text-app-muted">Click to upload avatar</p>
            </div>

            {/* ── Basic Info ── */}
            <div>
                <p className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3">Basic Information</p>
                <div className="flex flex-col gap-3">
                    {field('Full Name *', 'name', 'text', 'John Doe')}
                    {field('Email *', 'email', 'email', 'john@example.com')}
                    <div>
                        <label className="block text-xs font-semibold text-app-secondary mb-1.5">
                            Password {user ? '(leave blank to keep)' : '*'}
                        </label>
                        <input className="input-field" type="password" value={form.password}
                            onChange={e => set('password', e.target.value)} placeholder="••••••••" />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    {field('Phone Number', 'phone_number', 'text', '+212 6 00 00 00 00')}
                </div>
            </div>

            {/* ── Professional Info ── */}
            <div>
                <p className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3">Professional</p>
                <div className="flex flex-col gap-3">
                    {field('Job Title', 'job_title', 'text', 'Senior Developer')}
                    <div className="grid grid-cols-2 gap-3">
                        {select('Employment Type', 'employment_type', EMPLOYMENT_TYPES)}
                        {select('Contract Type', 'contract_type', CONTRACT_TYPES)}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {field('Years of Experience', 'years_of_experience', 'number', '0')}
                        <div>
                            <label className="block text-xs font-semibold text-app-secondary mb-1.5">Salary (MAD)</label>
                            <div className="relative">
                                <input className="input-field pr-14" type="number" min="0" step="0.01"
                                    value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="0.00" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-app-muted">MAD</span>
                            </div>
                            {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {field('Hire Date', 'hire_date', 'date')}
                        {field('Contract Start', 'contract_start_date', 'date')}
                        {field('Contract End', 'contract_end_date', 'date')}
                    </div>
                </div>
            </div>

            {/* ── Personal Info ── */}
            <div>
                <p className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3">Personal</p>
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        {field('Date of Birth', 'date_of_birth', 'date')}
                        {field('National ID (CIN)', 'national_id', 'text', 'AB123456')}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-app-secondary mb-1.5">Address</label>
                        <textarea className="input-field resize-none" rows={2}
                            value={form.address} onChange={e => set('address', e.target.value)}
                            placeholder="123 Rue Mohammed V, Casablanca" />
                    </div>
                </div>
            </div>

            {/* ── Education ── */}
            <div>
                <p className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3">Education</p>
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        {field('Education Level', 'education_level', 'text', 'Master, Licence, Bac…')}
                        {field('Field of Study', 'field_of_study', 'text', 'Computer Science')}
                    </div>
                    {field('University', 'university', 'text', 'Université Mohammed V')}
                    <div>
                        <label className="block text-xs font-semibold text-app-secondary mb-1.5">Certifications</label>
                        <textarea className="input-field resize-none" rows={2}
                            value={form.certifications} onChange={e => set('certifications', e.target.value)}
                            placeholder="AWS, Azure, PMP, Scrum Master…" />
                    </div>
                </div>
            </div>

            {/* ── Online Profiles ── */}
            <div>
                <p className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3">Online Profiles</p>
                <div className="flex flex-col gap-3">
                    {field('LinkedIn URL', 'linkedin_url', 'url', 'https://linkedin.com/in/username')}
                    {field('GitHub URL', 'github_url', 'url', 'https://github.com/username')}
                </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-2 border-t border-app">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading
                        ? <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</span>
                        : user ? 'Update' : 'Create'
                    }
                </button>
            </div>
        </form>
    )
}