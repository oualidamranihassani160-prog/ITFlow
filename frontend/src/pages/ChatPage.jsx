import { useEffect, useRef, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    Send, Users, MessageSquare, Eye,
    Paperclip, X, Trash2, FileText, Download, Shield, Crown,
} from 'lucide-react'
import {
    fetchContacts,
    fetchManagerContacts,
    fetchGroupMessages,
    sendGroupMessage,
    fetchPrivateMessages,
    sendPrivateMessage,
    fetchTeamMonitor,
    fetchAdminMonitor,
    fetchUnreadCounts,
    markGroupAsRead,
    setActiveChat,
    deleteMessage,
} from '../store/slices/chatSlice'
import Avatar from '../components/ui/Avatar'
import { formatRelativeTime } from '../utils/helpers'
import { equalId } from '../utils/id'
import toast from 'react-hot-toast'

const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const SidebarLabel = ({ children }) => (
    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-app-muted uppercase tracking-wide">
        {children}
    </p>
)

export default function ChatPage() {
    const dispatch = useDispatch()
    const { user } = useSelector(s => s.auth)
    const {
        contacts,
        managerContacts,
        groupMessages,
        managersGroupMessages,
        privateChats,
        teamMonitor,
        adminMonitor,
        activeChat,
        unreadCounts,
        groupUnreadCount,
        managersGroupUnread,
        loading,
    } = useSelector(s => s.chat)

    const [input, setInput]             = useState('')
    const [file, setFile]               = useState(null)
    const [filePreview, setFilePreview] = useState(null)
    const [monitorTab, setMonitorTab]   = useState('group')
    const [sending, setSending]         = useState(false)

    const bottomRef = useRef(null)
    const fileRef   = useRef(null)
    const pollRef   = useRef(null)

    const isAdmin   = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    const isManagerOrAdmin = isAdmin || isManager

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchContacts())

        // Admins should default to managers group — don't fetch team group for admins
        if (isAdmin) {
            // admins should see managers group and manager contacts
            dispatch(fetchManagerContacts())
            dispatch(fetchGroupMessages('managers'))
            dispatch(setActiveChat('managers-group'))
        } else {
            // everyone (including managers) fetch team group
            dispatch(fetchGroupMessages('team'))
            if (isManager) {
                // managers see a read-only monitor of their team's private messages by default
                dispatch(fetchManagerContacts())
                dispatch(fetchTeamMonitor())
                dispatch(setActiveChat('monitor'))
            }
        }

    dispatch(fetchUnreadCounts())
        if (isManager) dispatch(fetchTeamMonitor())
        if (isAdmin)   dispatch(fetchAdminMonitor())
    }, [])

    // ── When active chat changes ──────────────────────────────────────────────
    useEffect(() => {
        if (activeChat === 'group') {
            dispatch(markGroupAsRead('team'))
            dispatch(fetchGroupMessages('team'))
        } else if (activeChat === 'managers-group') {
            dispatch(markGroupAsRead('managers'))
            dispatch(fetchGroupMessages('managers'))
        } else if (activeChat !== 'monitor' && activeChat !== 'admin-monitor') {
            dispatch(fetchPrivateMessages(activeChat))
        }
    }, [activeChat])

    // ── Polling ───────────────────────────────────────────────────────────────
    const poll = useCallback(() => {
    dispatch(fetchGroupMessages('team'))
    if (isAdmin) dispatch(fetchGroupMessages('managers'))
        if (activeChat !== 'group' && activeChat !== 'managers-group' &&
            activeChat !== 'monitor' && activeChat !== 'admin-monitor') {
            dispatch(fetchPrivateMessages(activeChat))
        }
        dispatch(fetchUnreadCounts())
        if (isManager) dispatch(fetchTeamMonitor())
        if (isAdmin)   dispatch(fetchAdminMonitor())
    }, [activeChat, isManager, isAdmin, isManagerOrAdmin])

    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(poll, 4000)
        return () => clearInterval(pollRef.current)
    }, [poll])

    // ── Auto scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [groupMessages, managersGroupMessages, privateChats, activeChat])

    // ── Switch chat ───────────────────────────────────────────────────────────
    const handleSetActiveChat = (id) => {
        dispatch(setActiveChat(id))
        if (id === 'group') dispatch(markGroupAsRead('team'))
        if (id === 'managers-group') dispatch(markGroupAsRead('managers'))
    }

    // ── File ──────────────────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const f = e.target.files[0]
        if (!f) return
        if (f.size > 10 * 1024 * 1024) { toast.error('File too large. Max 10MB.'); return }
        setFile(f)
        setFilePreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
    }
    const clearFile = () => {
        setFile(null); setFilePreview(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    // ── Send ──────────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!input.trim() && !file) return
        setSending(true)
        const payload = new FormData()
        if (input.trim()) payload.append('body', input.trim())
        if (file) payload.append('file', file)

        let result
        if (activeChat === 'group') {
            result = await dispatch(sendGroupMessage({ payload, scope: 'team' }))
        } else if (activeChat === 'managers-group') {
            result = await dispatch(sendGroupMessage({ payload, scope: 'managers' }))
        } else {
            result = await dispatch(sendPrivateMessage({ userId: activeChat, payload }))
        }

        if (!result.error) { setInput(''); clearFile() }
        else {
            console.error('Send message failed:', result)
            toast.error(result.payload || 'Failed to send message.')
        }
        setSending(false)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        const r = await dispatch(deleteMessage(id))
        if (!r.error) toast.success('Message deleted.')
        else toast.error(r.payload || 'Failed to delete.')
    }

    // ── Derived data ──────────────────────────────────────────────────────────
    const isMonitorView = activeChat === 'monitor' || activeChat === 'admin-monitor'
    const isGroupView   = activeChat === 'group' || activeChat === 'managers-group'

    const currentMessages = activeChat === 'group'
        ? groupMessages
        : activeChat === 'managers-group'
            ? managersGroupMessages
            : (privateChats[activeChat] || [])

    const allDmContacts = [
        ...contacts,
        ...managerContacts.filter(mc => mc.id !== user?.id && !contacts.some(c => c.id === mc.id)),
    ]
    const activeContact = allDmContacts.find(c => c.id === activeChat)

    const employeeContacts = contacts.filter(c => c.role === 'employee')
    const managerDmList    = allDmContacts.filter(c => c.role === 'manager' && c.id !== user?.id)
    const adminDmList      = allDmContacts.filter(c => c.role === 'admin'   && c.id !== user?.id)

    // ── Render file ───────────────────────────────────────────────────────────
    const renderFile = (msg) => {
        const { file_url: fileUrl, file_name: fileName, file_type: fileType, file_size: fileSize } = msg
        if (!fileUrl) return null
        if (fileType?.startsWith('image/')) {
            return (
                <a href={fileUrl} target="_blank" rel="noreferrer" className="block mt-2">
                    <img src={fileUrl} alt={fileName} className="max-w-48 max-h-48 rounded-xl object-cover border border-white/20" />
                    {fileSize && <p className="text-xs opacity-60 mt-1">{formatFileSize(fileSize)}</p>}
                </a>
            )
        }
        return (
            <a href={fileUrl} target="_blank" rel="noreferrer" download={fileName}
                className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <FileText size={14} className="shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs truncate max-w-36">{fileName}</span>
                    {fileSize && <span className="text-xs opacity-60">{formatFileSize(fileSize)}</span>}
                </div>
                <Download size={12} className="shrink-0 ml-auto" />
            </a>
        )
    }

    // ── Contact row ───────────────────────────────────────────────────────────
    const ContactRow = ({ contact, unread = 0 }) => (
        <button
            onClick={() => handleSetActiveChat(contact.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeChat === contact.id
                    ? 'bg-primary-50 dark:bg-primary-950/40'
                    : 'hover:bg-primary-50/50 dark:hover:bg-primary-950/20'
            }`}
        >
            <div className="relative shrink-0">
                <Avatar src={contact.avatar} name={contact.name} size="sm" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${unread > 0 ? 'font-bold' : 'font-semibold'} text-app-primary`}>
                    {contact.name}
                </p>
                <p className="text-xs text-app-muted capitalize">{contact.role}</p>
            </div>
            {unread > 0 && (
                <span className="shrink-0 min-w-5 h-5 px-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                </span>
            )}
        </button>
    )

    // ── Group button ──────────────────────────────────────────────────────────
    const GroupButton = ({ id, icon: Icon, iconBg, activeBg, label, sub, unread }) => (
        <button
            onClick={() => handleSetActiveChat(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-app transition-colors ${
                activeChat === id ? activeBg : 'hover:bg-primary-50/50 dark:hover:bg-primary-950/20'
            }`}
        >
            <div className="relative shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
                    <Icon size={16} />
                </div>
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${unread > 0 ? 'font-bold' : 'font-semibold'} text-app-primary`}>{label}</p>
                <p className="text-xs text-app-muted">{sub}</p>
            </div>
            {unread > 0 && (
                <span className="shrink-0 min-w-5 h-5 px-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                </span>
            )}
        </button>
    )

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-8rem)] card overflow-hidden">

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <div className="w-64 shrink-0 border-r border-app flex flex-col">
                <div className="px-4 py-3 border-b border-app">
                    <h2 className="text-sm font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Team Chat
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin">

                    {/* Team group — everyone */}
                    {!isAdmin && (
                                <GroupButton
                                id="group"
                                icon={Users}
                                iconBg="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                                activeBg="bg-primary-50 dark:bg-primary-950/40"
                                label="Team Group"
                                sub="Everyone in your team"
                                unread={groupUnreadCount}
                            />
                        )  
                    }

                    {/* Managers group — managers + admin only */}
                    {isManagerOrAdmin && (
                        <GroupButton
                            id="managers-group"
                            icon={Crown}
                            iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                            activeBg="bg-amber-50 dark:bg-amber-950/20"
                            label="Managers Group"
                            sub="Managers &amp; Admin only"
                            unread={managersGroupUnread}
                        />
                    )}

                    {/* Manager team monitor */}
                    {isManager && (
                        <button
                            onClick={() => handleSetActiveChat('monitor')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-app transition-colors ${
                                activeChat === 'monitor'
                                    ? 'bg-teal-50 dark:bg-teal-950/20'
                                    : 'hover:bg-primary-50/50 dark:hover:bg-primary-950/20'
                            }`}
                        >
                            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                                <Eye size={16} className="text-teal-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-app-primary">All Messages</p>
                                <p className="text-xs text-app-muted">Monitor team activity</p>
                            </div>
                        </button>
                    )}

                    {/* Admin monitor */}
                    {isAdmin && (
                        <button
                            onClick={() => handleSetActiveChat('admin-monitor')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-app transition-colors ${
                                activeChat === 'admin-monitor'
                                    ? 'bg-violet-50 dark:bg-violet-950/20'
                                    : 'hover:bg-primary-50/50 dark:hover:bg-primary-950/20'
                            }`}
                        >
                            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                <Shield size={16} className="text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-app-primary">Manager DMs</p>
                                <p className="text-xs text-app-muted">Monitor manager chats</p>
                            </div>
                        </button>
                    )}

                    {/* Admin DMs (shown to managers) */}
                    {isManager && adminDmList.length > 0 && (
                        <>
                            <SidebarLabel>Admin</SidebarLabel>
                            {adminDmList.map(c => <ContactRow key={c.id} contact={c} unread={unreadCounts[c.id] || 0} />)}
                        </>
                    )}

                    {/* Manager DMs */}
                    {isManagerOrAdmin && managerDmList.length > 0 && (
                        <>
                            <SidebarLabel>Managers</SidebarLabel>
                            {managerDmList.map(c => <ContactRow key={c.id} contact={c} unread={unreadCounts[c.id] || 0} />)}
                        </>
                    )}

                    {/* Employee DMs */}
                    {employeeContacts.length > 0 && (
                        <>
                            <SidebarLabel>Direct Messages</SidebarLabel>
                            {employeeContacts.map(c => <ContactRow key={c.id} contact={c} unread={unreadCounts[c.id] || 0} />)}
                        </>
                    )}

                    {/* Fallback for employees (their contacts aren't categorised above) */}
                    {!isManagerOrAdmin && contacts.filter(c => c.role !== 'employee').length > 0 && (
                        <>
                            <SidebarLabel>Direct Messages</SidebarLabel>
                            {contacts.filter(c => c.role !== 'employee').map(c => (
                                <ContactRow key={c.id} contact={c} unread={unreadCounts[c.id] || 0} />
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── Main area ──────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <div className="h-14 flex items-center px-5 border-b border-app shrink-0 bg-card">
                    {activeChat === 'group' && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <Users size={14} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-app-primary">Team Group Chat</p>
                                <p className="text-xs text-app-muted">{contacts.length + 1} members</p>
                            </div>
                        </div>
                    )}
                    {activeChat === 'managers-group' && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Crown size={14} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-app-primary">Managers Group</p>
                                <p className="text-xs text-app-muted">Only managers and admin can see this</p>
                            </div>
                        </div>
                    )}
                    {activeChat === 'monitor' && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                <Eye size={14} className="text-teal-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-app-primary">All Team Messages</p>
                                <p className="text-xs text-app-muted">Read-only monitoring view</p>
                            </div>
                        </div>
                    )}
                    {activeChat === 'admin-monitor' && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <Shield size={14} className="text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-app-primary">Manager Conversations</p>
                                <p className="text-xs text-app-muted">All manager ↔ manager &amp; manager ↔ admin DMs</p>
                            </div>
                        </div>
                    )}
                    {activeContact && (
                        <div className="flex items-center gap-3">
                            <Avatar src={activeContact.avatar} name={activeContact.name} size="sm" />
                            <div>
                                <p className="text-sm font-bold text-app-primary">{activeContact.name}</p>
                                <p className="text-xs text-app-muted capitalize">{activeContact.role}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Manager monitor ───────────────────────────────────────── */}
                {activeChat === 'monitor' ? (
                    // Manager monitor: read-only view of direct messages between manager and employees
                    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
                        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-800/20 mb-1">
                            <p className="text-xs text-teal-700 dark:text-teal-300 font-medium flex items-center gap-1.5">
                                <Eye size={12} /> Read-only view of direct messages between this manager and their employees.
                            </p>
                        </div>

                        {teamMonitor.filter(m => !m.is_group).length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <MessageSquare size={28} className="text-app-muted" />
                                <p className="text-app-muted text-sm">No direct messages yet.</p>
                            </div>
                        )}

                        {teamMonitor.filter(m => !m.is_group).map(m => (
                            <div key={m.id} className="card p-3 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{m.sender?.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 capitalize">{m.sender?.role}</span>
                                    {m.receiver && (
                                        <>
                                            <span className="text-xs text-app-muted">→</span>
                                            <span className="text-xs font-semibold text-app-secondary">{m.receiver?.name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 capitalize">{m.receiver?.role}</span>
                                        </>
                                    )}
                                    <span className="ml-auto text-xs text-app-muted">{formatRelativeTime(m.created_at)}</span>
                                </div>
                                {m.body && <p className="text-sm text-app-primary">{m.body}</p>}
                            </div>
                        ))}
                    </div>

                ) : activeChat === 'admin-monitor' ? (
                    /* ── Admin monitor ────────────────────────────────────── */
                    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
                        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/30 mb-1">
                            <p className="text-xs text-violet-700 dark:text-violet-300 font-medium flex items-center gap-1.5">
                                <Shield size={12} /> Read-only view of all direct messages between managers and between managers and admin.
                            </p>
                        </div>
                        {adminMonitor.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <MessageSquare size={28} className="text-app-muted" />
                                <p className="text-app-muted text-sm">No manager DMs yet.</p>
                            </div>
                        )}
                        {adminMonitor.map(m => (
                            <div key={m.id} className="card p-3 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{m.sender?.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 capitalize">{m.sender?.role}</span>
                                    {m.receiver && (
                                        <><span className="text-xs text-app-muted">→</span>
                                        <span className="text-xs font-semibold text-app-secondary">{m.receiver?.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 capitalize">{m.receiver?.role}</span></>
                                    )}
                                    <span className="ml-auto text-xs text-app-muted">{formatRelativeTime(m.created_at)}</span>
                                </div>
                                {m.body && <p className="text-sm text-app-primary">{m.body}</p>}
                            </div>
                        ))}
                    </div>

                ) : (
                    /* ── Messages list ────────────────────────────────────── */
                    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
                        {!loading && currentMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                <MessageSquare size={36} className="text-app-muted" />
                                <p className="text-app-muted text-sm">No messages yet. Say hello!</p>
                            </div>
                        )}
                        {currentMessages.map(msg => {
                            const isOwn = equalId(msg.sender_id, user?.id)
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                                    {!isOwn && <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="xs" />}
                                    <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                                        {!isOwn && (
                                            <span className="text-xs font-semibold text-app-secondary px-1">{msg.sender?.name}</span>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                            isOwn
                                                ? 'bg-primary-600 text-white rounded-br-sm'
                                                : 'bg-primary-50 dark:bg-primary-950/40 text-app-primary rounded-bl-sm'
                                        }`}>
                                            {msg.body && <p>{msg.body}</p>}
                                            {renderFile(msg)}
                                        </div>
                                        <div className={`flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-xs text-app-muted">{formatRelativeTime(msg.created_at)}</span>
                                            {(isOwn && !isMonitorView) && (
                                                <button onClick={() => handleDelete(msg.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500"
                                                    title="Delete message">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* ── Input ─────────────────────────────────────────────────── */}
                {!isMonitorView && (
                    <div className="border-t border-app p-3 flex flex-col gap-2 shrink-0 bg-card">
                        {file && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-950/40">
                                {filePreview
                                    ? <img src={filePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                    : <FileText size={18} className="text-primary-500 shrink-0" />}
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-xs text-app-secondary truncate">{file.name}</span>
                                    <span className="text-xs text-app-muted">{formatFileSize(file.size)}</span>
                                </div>
                                <button onClick={clearFile} className="text-app-muted hover:text-red-500 transition-colors shrink-0">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        <div className="flex items-end gap-2">
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="p-2 rounded-lg text-app-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors shrink-0"
                                title="Attach file">
                                <Paperclip size={18} />
                            </button>
                            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
                                accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
                            <textarea
                                className="input-field flex-1 resize-none min-h-10 max-h-28 py-2"
                                rows={1}
                                placeholder="Type a message"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                            />
                            <button onClick={handleSend} disabled={(!input.trim() && !file) || sending}
                                className="btn-primary px-3 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                                {sending
                                    ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    : <Send size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
