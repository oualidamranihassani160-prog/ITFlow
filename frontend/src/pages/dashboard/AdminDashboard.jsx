import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Users, UserCheck, CheckSquare, Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { fetchStats } from '../../store/slices/usersSlice'
import { fetchTasks } from '../../store/slices/tasksSlice'
import { fetchUsers } from '../../store/slices/usersSlice'
import StatCard from '../../components/ui/StatCard'
import TaskCard from '../../components/tasks/TaskCard'
import Avatar from '../../components/ui/Avatar'
import { RoleBadge } from '../../components/ui/Badge'

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const { stats } = useSelector(s => s.users)
  const { items: tasks, loading: tasksLoading } = useSelector(s => s.tasks)
  const { items: users } = useSelector(s => s.users)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(fetchStats())
    dispatch(fetchTasks({ per_page: 6 }))
    dispatch(fetchUsers({ per_page: 5, role: 'manager' }))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-app-secondary text-sm mt-1">Here's what's happening across your organization today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Managers" value={stats?.total_managers ?? '—'} icon={Users} color="primary" />
        <StatCard label="Employees" value={stats?.total_employees ?? '—'} icon={UserCheck} color="blue" />
        <StatCard label="Total Tasks" value={stats?.total_tasks ?? '—'} icon={CheckSquare} color="primary" />
        <StatCard label="Pending" value={stats?.pending_tasks ?? '—'} icon={AlertCircle} color="yellow" />
        <StatCard label="In Progress" value={stats?.in_progress_tasks ?? '—'} icon={Clock} color="blue" />
        <StatCard label="Completed" value={stats?.completed_tasks ?? '—'} icon={CheckCircle2} color="green" />
      </div>

      {/* Progress bar */}
      {stats && stats.total_tasks > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-500" />
              <span className="text-sm font-semibold text-app-primary">Overall Task Progress</span>
            </div>
            <span className="text-sm font-bold text-primary-600">
              {Math.round((stats.completed_tasks / stats.total_tasks) * 100)}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-primary-100 dark:bg-primary-950 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((stats.completed_tasks / stats.total_tasks) * 100)}%`,
                background: 'linear-gradient(90deg, #088395, #09637e)',
              }}
            />
          </div>
          <div className="flex items-center gap-6 mt-3">
            {[
              { label: 'Pending', count: stats.pending_tasks, color: '#d97706' },
              { label: 'In Progress', count: stats.in_progress_tasks, color: '#2563eb' },
              { label: 'Completed', count: stats.completed_tasks, color: '#059669' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs text-app-muted">{label}: <strong className="text-app-secondary">{count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Tasks</h2>
          </div>
          {tasksLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-primary-100 dark:bg-primary-900 rounded mb-3 w-2/3" />
                  <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded mb-2 w-full" />
                  <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {tasks.slice(0, 6).map(task => <TaskCard key={task.id} task={task} />)}
              {tasks.length === 0 && (
                <div className="card p-8 text-center col-span-2">
                  <CheckSquare size={32} className="text-app-muted mx-auto mb-2" />
                  <p className="text-app-muted text-sm">No tasks yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Managers list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>Managers</h2>
          </div>
          <div className="card overflow-hidden">
            {users.filter(u => u.role === 'manager').length === 0 ? (
              <p className="p-6 text-center text-app-muted text-sm">No managers yet</p>
            ) : (
              users.filter(u => u.role === 'manager').map((mgr, i, arr) => (
                <div key={mgr.id} className={`flex items-center gap-3 p-4 ${i < arr.length - 1 ? 'border-b border-app' : ''}`}>
                  <Avatar src={mgr.avatar} name={mgr.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-app-primary truncate">{mgr.name}</p>
                    <p className="text-xs text-app-muted truncate">{mgr.email}</p>
                  </div>
                  <RoleBadge role={mgr.role} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
