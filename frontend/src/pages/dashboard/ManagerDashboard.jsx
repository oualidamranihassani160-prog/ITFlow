import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UserCheck, CheckSquare, Clock, AlertCircle, CheckCircle2, Plus } from 'lucide-react'
import { fetchStats } from '../../store/slices/usersSlice'
import { fetchMyEmployees } from '../../store/slices/usersSlice'
import { fetchTasks } from '../../store/slices/tasksSlice'
import StatCard from '../../components/ui/StatCard'
import TaskCard from '../../components/tasks/TaskCard'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import TaskForm from '../../components/tasks/TaskForm'
import { StatusBadge } from '../../components/ui/Badge'

export default function ManagerDashboard() {
  const dispatch = useDispatch()
  const { stats, employees } = useSelector(s => s.users)
  const { items: tasks, loading: tasksLoading } = useSelector(s => s.tasks)
  const { user } = useSelector(s => s.auth)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchStats())
    dispatch(fetchMyEmployees({ per_page: 5 }))
    dispatch(fetchTasks({ per_page: 6 }))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>
            Manager Dashboard
          </h1>
          <p className="text-app-secondary text-sm mt-1">Manage your team and track task progress.</p>
        </div>
        <button onClick={() => setCreateTaskOpen(true)} className="btn-primary">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="My Employees" value={stats?.total_employees ?? '—'} icon={UserCheck} color="primary" />
        <StatCard label="Total Tasks" value={stats?.total_tasks ?? '—'} icon={CheckSquare} color="primary" />
        <StatCard label="Pending" value={stats?.pending_tasks ?? '—'} icon={AlertCircle} color="yellow" />
        <StatCard label="In Progress" value={stats?.in_progress_tasks ?? '—'} icon={Clock} color="blue" />
        <StatCard label="Completed" value={stats?.completed_tasks ?? '—'} icon={CheckCircle2} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>My Tasks</h2>
          </div>
          {tasksLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-primary-100 dark:bg-primary-900 rounded mb-3 w-2/3" />
                  <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {tasks.slice(0, 6).map(task => <TaskCard key={task.id} task={task} />)}
              {tasks.length === 0 && (
                <div className="card p-8 text-center col-span-2">
                  <CheckSquare size={32} className="text-app-muted mx-auto mb-2" />
                  <p className="text-app-muted text-sm mb-3">No tasks yet</p>
                  <button onClick={() => setCreateTaskOpen(true)} className="btn-primary text-xs">
                    <Plus size={14} /> Create your first task
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Employees */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>My Team</h2>
          </div>
          <div className="card overflow-hidden">
            {employees.length === 0 ? (
              <p className="p-6 text-center text-app-muted text-sm">No employees yet</p>
            ) : (
              employees.map((emp, i, arr) => {
                const empTasks = tasks.filter(t => t.employee_id === emp.id)
                const completed = empTasks.filter(t => t.status === 'completed').length
                return (
                  <div key={emp.id} className={`p-4 ${i < arr.length - 1 ? 'border-b border-app' : ''}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar src={emp.avatar} name={emp.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-app-primary truncate">{emp.name}</p>
                        <p className="text-xs text-app-muted truncate">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-app-muted">
                      <span>{empTasks.length} tasks</span>
                      <span>·</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{completed} done</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Modal open={createTaskOpen} onClose={() => setCreateTaskOpen(false)} title="Create Task">
        <TaskForm onClose={() => setCreateTaskOpen(false)} />
      </Modal>
    </div>
  )
}
