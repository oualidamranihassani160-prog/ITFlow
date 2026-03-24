import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    LayoutDashboard, Users, UserCheck, CheckSquare, KanbanSquare,
    Bell, User, Archive, LogOut, ChevronLeft, ChevronRight, MessageSquare
} from 'lucide-react'
import { logoutUser } from '../../store/slices/authSlice'
import { toggleSidebar } from '../../store/slices/uiSlice'
import { fetchUnreadCounts } from '../../store/slices/chatSlice'
import toast from 'react-hot-toast'

const navItems = {
    admin: [
        { to: '/dashboard/admin',    icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/dashboard/users',    icon: Users,           label: 'Users' },
        { to: '/dashboard/tasks',    icon: CheckSquare,     label: 'Tasks' },
        { to: '/dashboard/board',    icon: KanbanSquare,    label: 'Board' },
        { to: '/dashboard/archived', icon: Archive,         label: 'Archived' },
        { to: '/dashboard/chat',      icon: MessageSquare,   label: 'Team Chat', chat: true },
    ],
    manager: [
        { to: '/dashboard/manager',   icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/dashboard/employees', icon: UserCheck,       label: 'Employees' },
        { to: '/dashboard/tasks',     icon: CheckSquare,     label: 'Tasks' },
        { to: '/dashboard/board',     icon: KanbanSquare,    label: 'Board' },
        { to: '/dashboard/chat',      icon: MessageSquare,   label: 'Team Chat', chat: true },
    ],
    employee: [
        { to: '/dashboard/employee', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/dashboard/tasks',    icon: CheckSquare,     label: 'My Tasks' },
        { to: '/dashboard/board',    icon: KanbanSquare,    label: 'Board' },
        { to: '/dashboard/chat',     icon: MessageSquare,   label: 'Team Chat', chat: true },
    ],
}

export default function Sidebar() {
    const dispatch   = useDispatch()
    const navigate   = useNavigate()
    const { user }   = useSelector(s => s.auth)
    const { sidebarOpen, sidebarMobileOpen } = useSelector(s => s.ui)
    const { unreadCounts, groupUnreadCount, managersGroupUnread } = useSelector(s => s.chat)
    const { unreadCount: notifCount } = useSelector(s => s.notifications)

    // Debug: log incoming unread values so we can trace why the sidebar badge
    // doesn't update while the chat page shows new messages. Remove after debugging.
    // eslint-disable-next-line no-console
    console.debug('Sidebar unread state:', { groupUnreadCount, unreadCounts, notifCount })

    const items = navItems[user?.role] || []

    // Total chat unread = group unread + all private unreads
    const privateTotalUnread = Object.values(unreadCounts || {}).reduce((sum, n) => sum + n, 0)
    // Include managersGroupUnread so managers-group messages also show as Team Chat unread
    const totalChatUnread    = (groupUnreadCount || 0) + (managersGroupUnread || 0) + privateTotalUnread

    // Poll unread counts every 5 seconds from sidebar so badge works on any page
    useEffect(() => {
        if (!user) return
        dispatch(fetchUnreadCounts())
        const interval = setInterval(() => {
            dispatch(fetchUnreadCounts())
        }, 5000)
        return () => clearInterval(interval)
    }, [user])

    const handleLogout = async () => {
        await dispatch(logoutUser())
        toast.success('Logged out successfully')
        navigate('/login')
    }

    const isOpen = sidebarOpen

    // ── Sidebar item with optional badge ─────────────────────────────────────
    const SidebarItem = ({ to, icon: Icon, label, showBadge, badgeCount, collapsed }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `sidebar-item relative ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
        >
            <div className="relative shrink-0">
                <Icon size={18} />
                {showBadge && badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none border border-sidebar">
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                )}
            </div>
            {!collapsed && (
                <>
                    <span className="flex-1">{label}</span>
                    {showBadge && badgeCount > 0 && (
                        <span className="w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                            {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    )

    return (
        <>
            {/* ── Desktop sidebar ─────────────────────────────────────────── */}
            <aside
                className={`hidden lg:flex flex-col transition-all duration-300 relative z-10 shrink-0 ${isOpen ? 'w-60' : 'w-16'}`}
                style={{ background: 'var(--bg-sidebar)' }}
            >
                {/* Logo */}
                <div className={`flex items-center h-16 px-4 border-b border-white/10 ${isOpen ? 'gap-3' : 'justify-center'}`}>
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    {isOpen && (
                        <span className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                            ITFlow
                        </span>
                    )}
                </div>

                {/* Nav items */}
                <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto scrollbar-thin">
                    {items.map(({ to, icon, label, chat }) => (
                        <SidebarItem
                            key={to}
                            to={to}
                            icon={icon}
                            label={label}
                            showBadge={!!chat}
                            badgeCount={chat ? totalChatUnread : 0}
                            collapsed={!isOpen}
                        />
                    ))}

                    {/* Notifications */}
                    <NavLink
                        to="/dashboard/notifications"
                        className={({ isActive }) =>
                            `sidebar-item relative ${isActive ? 'active' : ''} ${!isOpen ? 'justify-center px-0' : ''}`
                        }
                        title={!isOpen ? 'Notifications' : undefined}
                    >
                        <div className="relative shrink-0">
                            <Bell size={18} />
                            {notifCount > 0 &&(
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                                    {notifCount > 9 ? '9+' : notifCount}
                                </span>
                            )}
                        </div>
                        {isOpen && (
                            <>
                                <span className="flex-1">Notifications</span>
                                {notifCount > 0 && (
                                    <span className="w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                                        {notifCount > 9 ? '9+' : notifCount}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                </nav>

                {/* User section */}
                <div className="p-3 border-t border-white/10">
                    <NavLink
                        to="/dashboard/profile"
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''} ${!isOpen ? 'justify-center px-0' : ''}`
                        }
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                            <User size={18} className="shrink-0" />
                        )}
                        {isOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                                <p className="text-white/50 text-xs capitalize">{user?.role}</p>
                            </div>
                        )}
                    </NavLink>

                    <button
                        onClick={handleLogout}
                        className={`sidebar-item w-full hover:text-red-300 mt-1 ${!isOpen ? 'justify-center px-0' : ''}`}
                        title={!isOpen ? 'Logout' : undefined}
                    >
                        <LogOut size={18} className="shrink-0" />
                        {isOpen && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => dispatch(toggleSidebar())}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors z-20"
                >
                    {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                </button>
            </aside>

            {/* ── Mobile sidebar ───────────────────────────────────────────── */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col lg:hidden transition-transform duration-300 ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ background: 'var(--bg-sidebar)' }}
            >
                <div className="flex items-center gap-3 h-16 px-4 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>ITFlow</span>
                </div>

                <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
                    {items.map(({ to, icon, label, chat }) => (
                        <SidebarItem
                            key={to}
                            to={to}
                            icon={icon}
                            label={label}
                            showBadge={!!chat}
                            badgeCount={chat ? totalChatUnread : 0}
                            collapsed={false}
                        />
                    ))}

                    <NavLink
                        to="/dashboard/notifications"
                        className={({ isActive }) => `sidebar-item relative ${isActive ? 'active' : ''}`}
                    >
                        <div className="relative shrink-0">
                            <Bell size={18} />
                            {notifCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                                    {notifCount > 9 ? '9+' : notifCount}
                                </span>
                            )}
                        </div>
                        <span className="flex-1">Notifications</span>
                        {notifCount > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                                {notifCount > 9 ? '9+' : notifCount}
                            </span>
                        )}
                    </NavLink>
                </nav>

                <div className="p-3 border-t border-white/10">
                    <NavLink to="/dashboard/profile" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                        <User size={18} />
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                            <p className="text-white/50 text-xs capitalize">{user?.role}</p>
                        </div>
                    </NavLink>
                    <button onClick={handleLogout} className="sidebar-item w-full hover:text-red-300 mt-1">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    )
}