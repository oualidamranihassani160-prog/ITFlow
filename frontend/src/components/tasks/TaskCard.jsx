import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MoreVertical, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { updateTask, deleteTask } from '../../store/slices/tasksSlice'
import { equalId } from '../../utils/id'
import { StatusBadge, PriorityBadge } from '../ui/Badge'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import TaskForm from './TaskForm'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function TaskCard({ task }) {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const canEdit = user?.role !== 'employee'
  const canChangeStatus = user?.role === 'employee' && equalId(task.employee_id, user.id)

  const handleStatusChange = async (newStatus) => {
  const result = await dispatch(updateTask({ id: task.hash_id ?? task.id, data: { status: newStatus } }))
    if (!result.error) {
      toast.success('Status updated!')
    } else {
      // show backend message when possible to aid debugging
      const payload = result.payload
      const msg = typeof payload === 'string' ? payload : (payload?.message ?? 'Failed to update status')
      console.error('Update task error:', result)
      toast.error(msg)
    }
    setMenuOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm('Archive this task?')) return
  const result = await dispatch(deleteTask(task.hash_id ?? task.id))
    if (!result.error) toast.success('Task archived')
    else toast.error('Failed to archive task')
  }

  return (
    <>
      <div className="card p-4 hover:shadow-app-lg transition-all duration-200 group">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-app-muted hover:bg-primary-50 dark:hover:bg-primary-950 transition-all"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 card shadow-app-lg z-10 overflow-hidden animate-slide-up">
                {canEdit && (
                  <button onClick={() => { setEditOpen(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-app-secondary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors">
                    <Edit2 size={13} /> Edit task
                  </button>
                )}
                {(canEdit || canChangeStatus) && task.status !== 'in_progress' && (
                  <button onClick={() => handleStatusChange('in_progress')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                    <Clock size={13} /> Mark In Progress
                  </button>
                )}
                {(canEdit || canChangeStatus) && task.status !== 'completed' && (
                  <button onClick={() => handleStatusChange('completed')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                    <CheckCircle size={13} /> Mark Completed
                  </button>
                )}
                {(canEdit || canChangeStatus) && task.status !== 'pending' && (
                  <button onClick={() => handleStatusChange('pending')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
                    <AlertCircle size={13} /> Mark Pending
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => { handleDelete(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-t border-app">
                    <Trash2 size={13} /> Archive
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-app-primary leading-snug mb-1.5 line-clamp-2">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-app-muted leading-relaxed line-clamp-2 mb-3">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-app">
          <div className="flex items-center gap-1.5">
            <Avatar src={task.employee?.avatar} name={task.employee?.name} size="xs" />
            <span className="text-xs text-app-secondary truncate max-w-24">{task.employee?.name}</span>
          </div>
          {task.due_date && (
            <span className="text-xs text-app-muted">{formatDate(task.due_date)}</span>
          )}
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Task">
        <TaskForm task={task} onClose={() => setEditOpen(false)} />
      </Modal>
    </>
  )
}
