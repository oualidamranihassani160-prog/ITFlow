import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { fetchStats } from '../../store/slices/usersSlice'
import { fetchTasks } from '../../store/slices/tasksSlice'
import StatCard from '../../components/ui/StatCard'
import TaskCard from '../../components/tasks/TaskCard'

export default function EmployeeDashboard() {
  const dispatch = useDispatch()
  const { stats } = useSelector(s => s.users)
  const { items: tasks, loading } = useSelector(s => s.tasks)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(fetchStats())
    dispatch(fetchTasks({ per_page: 9 }))
  }, [])

  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const pending = tasks.filter(t => t.status === 'pending')
  const completed = tasks.filter(t => t.status === 'completed')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>
          My Dashboard
        </h1>
        <p className="text-app-secondary text-sm mt-1">
          {user?.manager ? `Working under ${user.manager.name}` : 'Your task overview'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats?.total_tasks ?? '—'} icon={CheckSquare} color="primary" />
        <StatCard label="Pending" value={stats?.pending_tasks ?? '—'} icon={AlertCircle} color="yellow" />
        <StatCard label="In Progress" value={stats?.in_progress_tasks ?? '—'} icon={Clock} color="blue" />
        <StatCard label="Completed" value={stats?.completed_tasks ?? '—'} icon={CheckCircle2} color="green" />
      </div>

      {/* Progress */}
      {stats && stats.total_tasks > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-app-primary">Your Progress</span>
            <span className="text-sm font-bold text-primary-600">
              {Math.round((stats.completed_tasks / stats.total_tasks) * 100)}% complete
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-primary-100 dark:bg-primary-950 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((stats.completed_tasks / stats.total_tasks) * 100)}%`,
                background: 'linear-gradient(90deg, #7ab2b2, #088395)',
              }}
            />
          </div>
        </div>
      )}

      {/* Task sections */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-primary-100 dark:bg-primary-900 rounded mb-3 w-2/3" />
              <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {inProgress.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock size={14} /> In Progress ({inProgress.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inProgress.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertCircle size={14} /> Pending ({pending.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pending.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} /> Completed ({completed.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completed.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}
          {tasks.length === 0 && (
            <div className="card p-12 text-center">
              <CheckSquare size={40} className="text-app-muted mx-auto mb-3" />
              <p className="text-app-secondary font-medium">No tasks assigned yet</p>
              <p className="text-app-muted text-sm mt-1">Your manager will assign tasks to you soon.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
