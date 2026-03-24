import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../store/slices/notificationsSlice'
import { formatRelativeTime } from '../utils/helpers'
import toast from 'react-hot-toast'

const typeIcon = (type) => {
  if (type === 'task_assigned') return '📋'
  if (type === 'task_completed') return '✅'
  return '🔔'
}

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const { items, meta, loading, unreadCount } = useSelector(s => s.notifications)

  useEffect(() => {
    dispatch(fetchNotifications({ per_page: 50 }))
  }, [])

  const handleMarkAll = async () => {
    const r = await dispatch(markAllAsRead())
    if (!r.error) toast.success('All notifications marked as read')
  }

  const handleDelete = async (id) => {
    const r = await dispatch(deleteNotification(id))
    if (!r.error) {
      toast.success('Notification deleted')
    } else {
      console.error('Delete notification failed:', r)
      toast.error(r.payload || 'Failed to delete notification')
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-app-secondary text-sm mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="btn-secondary text-sm">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border-b border-app last:border-0 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900 shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-primary-100 dark:bg-primary-900 rounded w-3/4 mb-2" />
                <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Bell size={40} className="text-app-muted mx-auto mb-3" />
            <p className="text-app-secondary font-medium">No notifications yet</p>
            <p className="text-app-muted text-sm mt-1">You'll be notified when tasks are assigned or completed.</p>
          </div>
        ) : (
          items.map(notif => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 px-5 py-4 border-b border-app last:border-0 group transition-colors ${!notif.is_read ? 'bg-primary-50/50 dark:bg-primary-950/30' : ''}`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${!notif.is_read ? 'bg-primary-100 dark:bg-primary-900' : 'bg-primary-50 dark:bg-primary-950'}`}>
                {typeIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${!notif.is_read ? 'text-app-primary font-medium' : 'text-app-secondary'}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-app-muted mt-1">{formatRelativeTime(notif.created_at)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!notif.is_read && (
                  <button
                    onClick={() => dispatch(markAsRead(notif.id))}
                    className="p-1.5 rounded-md text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-1.5 rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {!notif.is_read && (
                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
