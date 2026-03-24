import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Search, Filter, X } from 'lucide-react'
import { fetchTasks } from '../../store/slices/tasksSlice'
import TaskCard from '../../components/tasks/TaskCard'
import Modal from '../../components/ui/Modal'
import TaskForm from '../../components/tasks/TaskForm'
import Pagination from '../../components/ui/Pagination'

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]
const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function TasksPage() {
  const dispatch = useDispatch()
  const { items: tasks, meta, loading } = useSelector(s => s.tasks)
  const { user } = useSelector(s => s.auth)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(() => {
    dispatch(fetchTasks({ search, status, priority, page, per_page: 12 }))
  }, [search, status, priority, page])

  useEffect(() => { load() }, [load])

  const clearFilters = () => {
    setSearch(''); setStatus(''); setPriority(''); setPage(1)
  }

  const hasFilters = search || status || priority

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>Tasks</h1>
          <p className="text-app-secondary text-sm mt-0.5">{meta?.total ?? 0} total tasks</p>
        </div>
        {user?.role !== 'employee' && (
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <input
              className="input-field pl-9"
              placeholder="Search tasks…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Status */}
          <select
            className="input-field w-auto min-w-36"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Priority */}
          <select
            className="input-field w-auto min-w-36"
            value={priority}
            onChange={e => { setPriority(e.target.value); setPage(1) }}
          >
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-app-muted hover:text-app-primary transition-colors">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-primary-100 dark:bg-primary-900 rounded-full w-20" />
                <div className="h-5 bg-primary-100 dark:bg-primary-900 rounded-full w-14" />
              </div>
              <div className="h-4 bg-primary-100 dark:bg-primary-900 rounded mb-2 w-3/4" />
              <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-full mb-1" />
              <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-16 text-center">
          <Filter size={36} className="text-app-muted mx-auto mb-3" />
          <p className="text-app-secondary font-semibold">No tasks found</p>
          <p className="text-app-muted text-sm mt-1">
            {hasFilters ? 'Try adjusting your filters' : 'No tasks have been created yet'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary mt-4 mx-auto">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Task">
        <TaskForm onClose={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
