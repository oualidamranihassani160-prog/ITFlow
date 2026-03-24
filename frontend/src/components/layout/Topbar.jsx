import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Menu, Sun, Moon, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { toggleDarkMode, toggleMobileSidebar } from '../../store/slices/uiSlice'
import { logoutUser } from '../../store/slices/authSlice'
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/slices/notificationsSlice'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '../../utils/helpers'

export default function Topbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { darkMode } = useSelector(s => s.ui)
  const { items: notifications, unreadCount } = useSelector(s => s.notifications)

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    dispatch(fetchNotifications({ per_page: 8 }))
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Logged out')
    navigate('/login')
  }

  const handleNotifClick = (notif) => {
    if (!notif.is_read) dispatch(markAsRead(notif.id))
    setNotifOpen(false)
  }

  const notifTypeIcon = (type) => {
    if (type === 'task_assigned') return '📋'
    if (type === 'task_completed') return '✅'
    return '🔔'
  }

  return (
    <header className="h-16 shrink-0 flex items-center px-4 lg:px-6 gap-4 border-b border-app"
      style={{ background: 'var(--bg-topbar)' }}>
      {/* Mobile menu toggle */}
      <button
        onClick={() => dispatch(toggleMobileSidebar())}
        className="lg:hidden p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 text-app-secondary transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Page title slot */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 text-app-secondary transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 text-app-secondary transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 card shadow-app-lg z-50 overflow-hidden animate-slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-app">
                <span className="font-semibold text-sm text-app-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllAsRead())}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <p className="text-center text-app-muted text-sm py-8">No notifications</p>
                ) : (
                  notifications.slice(0, 8).map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors border-b border-app last:border-0 ${!notif.is_read ? 'bg-primary-50/50 dark:bg-primary-950/30' : ''}`}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{notifTypeIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${!notif.is_read ? 'text-app-primary font-medium' : 'text-app-secondary'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-app-muted mt-1">{formatRelativeTime(notif.created_at)}</p>
                      </div>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-app">
                <Link
                  to="/dashboard/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #088395, #09637e)' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-app-primary leading-none">{user?.name}</p>
              <p className="text-xs text-app-muted capitalize leading-none mt-0.5">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-app-muted hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 card shadow-app-lg z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-app">
                <p className="text-sm font-semibold text-app-primary truncate">{user?.name}</p>
                <p className="text-xs text-app-muted truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link to="/dashboard/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-app-secondary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors">
                  <Settings size={15} /> Profile Settings
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
