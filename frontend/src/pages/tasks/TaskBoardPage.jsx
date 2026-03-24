import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, GripVertical } from 'lucide-react'
import { fetchTasks, updateTask } from '../../store/slices/tasksSlice'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import TaskForm from '../../components/tasks/TaskForm'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: '#d97706', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900' },
  { id: 'in_progress', label: 'In Progress', color: '#2563eb', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900' },
  { id: 'completed', label: 'Completed', color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900' },
]

export default function TaskBoardPage() {
  const dispatch = useDispatch()
  const { items: tasks, loading } = useSelector(s => s.tasks)
  const { user } = useSelector(s => s.auth)
  const [createOpen, setCreateOpen] = useState(false)
  const [columns, setColumns] = useState({ pending: [], in_progress: [], completed: [] })

  useEffect(() => {
    dispatch(fetchTasks({ per_page: 100 }))
  }, [])

  useEffect(() => {
    setColumns({
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      completed: tasks.filter(t => t.status === 'completed'),
    })
  }, [tasks])

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

  // draggableId is now the encoded/hash id (string). Use it as-is.
  const taskId = draggableId
    const newStatus = destination.droppableId

    // Optimistic update
    const srcCol = [...columns[source.droppableId]]
    const dstCol = source.droppableId === destination.droppableId ? srcCol : [...columns[destination.droppableId]]
    const [moved] = srcCol.splice(source.index, 1)
    dstCol.splice(destination.index, 0, { ...moved, status: newStatus })

    setColumns(prev => ({
      ...prev,
      [source.droppableId]: srcCol,
      [destination.droppableId]: dstCol,
    }))

    const result2 = await dispatch(updateTask({ id: taskId, data: { status: newStatus } }))
    if (result2.error) {
      toast.error('Failed to update task status')
      // Revert
      dispatch(fetchTasks({ per_page: 100 }))
    } else {
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`)
    }
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>Board</h1>
          <p className="text-app-secondary text-sm mt-0.5">Drag tasks between columns to update status</p>
        </div>
        {user?.role !== 'employee' && (
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 flex-1">
          {COLUMNS.map(col => (
            <div key={col.id} className="card p-4">
              <div className="h-5 bg-primary-100 dark:bg-primary-900 rounded mb-4 w-24 animate-pulse" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-3 mb-3 animate-pulse">
                  <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-1/2" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
            {COLUMNS.map(col => (
              <div key={col.id} className="flex flex-col min-h-0">
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-3 border ${col.bg} ${col.border}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-bold text-app-primary">{col.label}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 text-app-secondary">
                    {columns[col.id]?.length ?? 0}
                  </span>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-3 p-2 rounded-xl min-h-32 transition-colors ${snapshot.isDraggingOver ? `${col.bg} border-2 border-dashed ${col.border}` : ''}`}
                    >
                      {columns[col.id]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`card p-3.5 transition-shadow ${snapshot.isDragging ? 'shadow-app-lg rotate-1' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-0.5 text-app-muted hover:text-app-secondary cursor-grab active:cursor-grabbing">
                                  <GripVertical size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    <PriorityBadge priority={task.priority} />
                                  </div>
                                  <p className="text-sm font-semibold text-app-primary leading-snug line-clamp-2">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-app-muted mt-1 line-clamp-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-app">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar src={task.employee?.avatar} name={task.employee?.name} size="xs" />
                                      <span className="text-xs text-app-secondary truncate max-w-20">{task.employee?.name}</span>
                                    </div>
                                    {task.due_date && (
                                      <span className="text-xs text-app-muted">{formatDate(task.due_date)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {columns[col.id]?.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-app">
                          <p className="text-xs text-app-muted">No tasks</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Task">
        <TaskForm onClose={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
