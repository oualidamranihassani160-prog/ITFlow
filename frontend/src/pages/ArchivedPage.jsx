import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Archive, Users, CheckSquare, RotateCcw, Trash } from 'lucide-react'
import { fetchUsers } from '../store/slices/usersSlice'
import { fetchTasks, restoreTask, forceDeleteTask } from '../store/slices/tasksSlice'
import UserRow from '../components/users/UserRow'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function ArchivedPage() {
  const dispatch = useDispatch()
  const { items: users, loading: usersLoading } = useSelector(s => s.users)
  const { items: tasks, loading: tasksLoading } = useSelector(s => s.tasks)
  const [tab, setTab] = useState('users')

  useEffect(() => {
    dispatch(fetchUsers({ trashed: 'true', per_page: 50 }))
    dispatch(fetchTasks({ trashed: 'true', per_page: 50 }))
  }, [])

  const handleRestoreTask = async (id) => {
    const r = await dispatch(restoreTask(id))
    if (!r.error) toast.success('Task restored')
  }

  const handleForceDeleteTask = async (id) => {
    if (!confirm('Permanently delete this task?')) return
    const r = await dispatch(forceDeleteTask(id))
    if (!r.error) toast.success('Task permanently deleted')
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-app-primary flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          <Archive size={22} /> Archived Items
        </h1>
        <p className="text-app-secondary text-sm mt-0.5">Restore or permanently delete archived records.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-app">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-app-muted hover:text-app-secondary'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Archived</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-app-muted text-sm">Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Archive size={32} className="text-app-muted mx-auto mb-2" />
                      <p className="text-app-muted text-sm">No archived users</p>
                    </td>
                  </tr>
                ) : (
                  users.map(u => <UserRow key={u.id} user={u} isArchived />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasksLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-app-muted text-sm">Loading…</td></tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Archive size={32} className="text-app-muted mx-auto mb-2" />
                      <p className="text-app-muted text-sm">No archived tasks</p>
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task.id} className="border-b border-app last:border-0 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 group">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-app-primary line-clamp-1">{task.title}</p>
                        {task.description && <p className="text-xs text-app-muted line-clamp-1 mt-0.5">{task.description}</p>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-4 py-3">
                        {task.employee && (
                          <div className="flex items-center gap-2">
                            <Avatar src={task.employee.avatar} name={task.employee.name} size="xs" />
                            <span className="text-xs text-app-secondary">{task.employee.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleRestoreTask(task.id)}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors" title="Restore">
                            <RotateCcw size={14} />
                          </button>
                          <button onClick={() => handleForceDeleteTask(task.id)}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" title="Delete permanently">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
