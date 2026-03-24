import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createTask, updateTask } from '../../store/slices/tasksSlice'
import { fetchMyEmployees, fetchUsers } from '../../store/slices/usersSlice'
import toast from 'react-hot-toast'

export default function TaskForm({ task, onClose }) {
  const dispatch = useDispatch()
  const { employees, items: allUsers } = useSelector(s => s.users)
  const { user } = useSelector(s => s.auth)

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    employee_id: task?.employee_id || '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(fetchUsers({ role: 'employee', per_page: 100 }))
    } else if (user?.role === 'manager') {
      dispatch(fetchMyEmployees({ per_page: 100 }))
    }
  }, [])

const employeeList = user?.role === 'admin'
  ? allUsers.filter(u => u.role === 'employee')
  : employees

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.employee_id && !task) e.employee_id = 'Please select an employee'
    if (!form.priority) e.priority = 'Priority is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const payload = { ...form }
    if (!payload.due_date) delete payload.due_date

    let result
    if (task) {
      result = await dispatch(updateTask({ id: task.hash_id ?? task.id, data: payload }))
    } else {
      result = await dispatch(createTask(payload))
    }

    setLoading(false)

    if (result.error) {
      const err = result.payload
      if (typeof err === 'object') setErrors(err)
      else toast.error(typeof err === 'string' ? err : 'Something went wrong')
    } else {
      toast.success(task ? 'Task updated!' : 'Task created!')
      onClose()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-app-secondary mb-1.5">Title *</label>
        <input
          className="input-field"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Task title…"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-app-secondary mb-1.5">Description</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Task details…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Priority *</label>
          <select className="input-field" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Due Date</label>
          <input
            type="date"
            className="input-field"
            value={form.due_date}
            onChange={e => set('due_date', e.target.value)}
          />
        </div>
      </div>

      {/* Employee — not shown for employee role */}
      {user?.role !== 'employee' && (
        <div>
          <label className="block text-xs font-semibold text-app-secondary mb-1.5">Assign To *</label>
          <select
            className="input-field"
            value={form.employee_id}
            onChange={e => set('employee_id', e.target.value)}
          >
            <option value="">Select employee…</option>
            {employeeList.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          {errors.employee_id && <p className="text-red-500 text-xs mt-1">{errors.employee_id}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving…
            </span>
          ) : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}
