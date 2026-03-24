import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import { urlId } from '../../utils/id'

export const fetchContacts = createAsyncThunk('chat/fetchContacts', async (_, { rejectWithValue }) => {
    try { const { data } = await api.get('/chat/contacts'); return data.data }
    catch (e) { return rejectWithValue(e.response?.data?.message) }
})

export const fetchManagerContacts = createAsyncThunk('chat/fetchManagerContacts', async (_, { rejectWithValue }) => {
    try { const { data } = await api.get('/chat/manager-contacts'); return data.data }
    catch (e) { return rejectWithValue(e.response?.data?.message) }
})

// scope: 'team' | 'managers'
export const fetchGroupMessages = createAsyncThunk('chat/fetchGroup', async (scope = 'team', { rejectWithValue }) => {
    try {
        const { data } = await api.get('/chat/group', { params: { scope } })
        return { scope, messages: data.data }
    } catch (e) { return rejectWithValue(e.response?.data?.message) }
})

export const sendGroupMessage = createAsyncThunk(
    'chat/sendGroup',
    async ({ payload, scope = 'team' }, { rejectWithValue, dispatch }) => {
        try {
            const isForm = payload instanceof FormData
            if (isForm) payload.append('scope', scope)
            const { data } = await api.post('/chat/group', payload, {
                headers: isForm ? { 'Content-Type': 'multipart/form-data' } : {},
            })

            // Refresh unread counts and group messages immediately so sidebar and lists update
            // (dispatch here affects only the current client; other clients rely on polling or websockets)
            dispatch(fetchUnreadCounts())
            dispatch(fetchGroupMessages(scope))

            return { scope, message: data.data }
        } catch (e) { return rejectWithValue(e.response?.data?.message) }
    }
)

export const fetchPrivateMessages = createAsyncThunk('chat/fetchPrivate', async (userId, { rejectWithValue }) => {
    try {
        const rid = urlId(userId)
        const { data } = await api.get(`/chat/private/${rid}`)
        return { userId: rid, messages: data.data }
    } catch (e) { return rejectWithValue(e.response?.data?.message) }
})

export const sendPrivateMessage = createAsyncThunk('chat/sendPrivate', async ({ userId, payload }, { rejectWithValue }) => {
    try {
        const rid = urlId(userId)
        const isForm = payload instanceof FormData
        const { data } = await api.post(`/chat/private/${rid}`, payload, {
            headers: isForm ? { 'Content-Type': 'multipart/form-data' } : {},
        })
        return { userId: rid, message: data.data }
    } catch (e) { return rejectWithValue(e.response?.data?.message) }
})

export const fetchTeamMonitor = createAsyncThunk('chat/teamMonitor', async (_, { rejectWithValue }) => {
    try { const { data } = await api.get('/chat/team-monitor'); return data.data }
    catch (e) { return rejectWithValue(e.response?.data?.message) }
})

export const fetchAdminMonitor = createAsyncThunk('chat/adminMonitor', async (_, { rejectWithValue }) => {
    try { const { data } = await api.get('/chat/admin-monitor'); return data.data }
    catch (e) { return rejectWithValue(e.response?.data?.message) }
})

// scope: 'team' | 'managers'
export const markGroupAsRead = createAsyncThunk('chat/markGroupRead', async (scope = 'team', { rejectWithValue }) => {
    try { await api.post('/chat/group/read', { scope }); return scope }
    catch (e) { return rejectWithValue(e.response?.data?.message) }
})

export const fetchUnreadCounts = createAsyncThunk('chat/unreadCounts', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get('/chat/unread-counts')
        // debug: show unread counts returned by backend
        // eslint-disable-next-line no-console
        console.debug('fetchUnreadCounts ->', data.data)
        return data.data
    } catch (e) { return rejectWithValue(e.response?.data?.message) }
})

// Debugging aid: developers can see unread counts responses in console when this thunk runs
// (left intentionally lightweight; remove when issue is resolved)

export const deleteMessage = createAsyncThunk('chat/delete', async (id, { rejectWithValue }) => {
    try {
        const rid = urlId(id)
        await api.delete(`/chat/messages/${rid}`)
        return rid
    } catch (e) { return rejectWithValue(e.response?.data?.message) }
})

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        contacts:              [],
        managerContacts:       [],
        groupMessages:         [],       // team group
        managersGroupMessages: [],       // managers-only group
        privateChats:          {},
        teamMonitor:           [],
        adminMonitor:          [],
        activeChat:            'group',
        unreadCounts:          {},
        groupUnreadCount:      0,
        managersGroupUnread:   0,
        loading:               false,
        error:                 null,
    },
    reducers: {
        setActiveChat: (state, { payload }) => { state.activeChat = payload },
        clearChat: (state) => {
            state.contacts              = []
            state.managerContacts       = []
            state.groupMessages         = []
            state.managersGroupMessages = []
            state.privateChats          = {}
            state.teamMonitor           = []
            state.adminMonitor          = []
            state.activeChat            = 'group'
            state.unreadCounts          = {}
            state.groupUnreadCount      = 0
            state.managersGroupUnread   = 0
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchContacts.fulfilled, (state, { payload }) => {
                state.contacts = payload
            })
            .addCase(fetchManagerContacts.fulfilled, (state, { payload }) => {
                state.managerContacts = payload
            })
            .addCase(fetchGroupMessages.pending, (state) => { state.loading = true })
            .addCase(fetchGroupMessages.fulfilled, (state, { payload }) => {
                state.loading = false

                // If user is not currently viewing the group, increment the local unread counter
                // by the number of new messages observed in this fetch. This helps the sidebar
                // badge reflect recent messages immediately for this client (other clients
                // still rely on polling or websockets).
                if (payload.scope === 'managers') {
                    const prev = state.managersGroupMessages || []
                    // set new messages
                    state.managersGroupMessages = payload.messages
                    // if user isn't viewing managers group, bump unread by the delta
                    if (state.activeChat !== 'managers-group') {
                        const delta = Math.max(0, payload.messages.length - prev.length)
                        state.managersGroupUnread = (state.managersGroupUnread || 0) + delta
                        // debug
                        // eslint-disable-next-line no-console
                        console.debug('fetchGroupMessages.fulfilled (managers)', {
                            prevCount: prev.length,
                            newCount: payload.messages.length,
                            delta,
                            activeChat: state.activeChat,
                            managersGroupUnread: state.managersGroupUnread,
                        })
                    } else {
                        // debug when viewing
                        // eslint-disable-next-line no-console
                        console.debug('fetchGroupMessages.fulfilled (managers) viewing', {
                            count: payload.messages.length,
                            activeChat: state.activeChat,
                        })
                    }
                } else {
                    const prev = state.groupMessages || []
                    state.groupMessages = payload.messages
                    if (state.activeChat !== 'group') {
                        const delta = Math.max(0, payload.messages.length - prev.length)
                        state.groupUnreadCount = (state.groupUnreadCount || 0) + delta
                        // debug
                        // eslint-disable-next-line no-console
                        console.debug('fetchGroupMessages.fulfilled (team)', {
                            prevCount: prev.length,
                            newCount: payload.messages.length,
                            delta,
                            activeChat: state.activeChat,
                            groupUnreadCount: state.groupUnreadCount,
                        })
                    } else {
                        // debug when viewing
                        // eslint-disable-next-line no-console
                        console.debug('fetchGroupMessages.fulfilled (team) viewing', {
                            count: payload.messages.length,
                            activeChat: state.activeChat,
                        })
                    }
                }
            })
            .addCase(fetchGroupMessages.rejected, (state, { payload }) => {
                state.loading = false; state.error = payload
            })
            .addCase(sendGroupMessage.fulfilled, (state, { payload }) => {
                if (payload.scope === 'managers') {
                    const exists = state.managersGroupMessages.some(m => m.id === payload.message.id)
                    if (!exists) state.managersGroupMessages.push(payload.message)
                } else {
                    const exists = state.groupMessages.some(m => m.id === payload.message.id)
                    if (!exists) state.groupMessages.push(payload.message)
                }
            })
            .addCase(fetchPrivateMessages.fulfilled, (state, { payload }) => {
                state.privateChats[payload.userId] = payload.messages
                if (state.unreadCounts[payload.userId]) state.unreadCounts[payload.userId] = 0
            })
            .addCase(sendPrivateMessage.fulfilled, (state, { payload }) => {
                if (!state.privateChats[payload.userId]) state.privateChats[payload.userId] = []
                const exists = state.privateChats[payload.userId].some(m => m.id === payload.message.id)
                if (!exists) state.privateChats[payload.userId].push(payload.message)
            })
            .addCase(fetchTeamMonitor.fulfilled, (state, { payload }) => { state.teamMonitor = payload })
            .addCase(fetchAdminMonitor.fulfilled, (state, { payload }) => { state.adminMonitor = payload })
            .addCase(markGroupAsRead.fulfilled, (state, { payload: scope }) => {
                if (scope === 'managers') state.managersGroupUnread = 0
                else state.groupUnreadCount = 0
            })
            .addCase(fetchUnreadCounts.fulfilled, (state, { payload }) => {
                state.unreadCounts          = payload.private        || {}
                state.groupUnreadCount      = payload.group          || 0
                state.managersGroupUnread   = payload.managers_group || 0
            })
            .addCase(deleteMessage.fulfilled, (state, { payload: id }) => {
                state.groupMessages         = state.groupMessages.filter(m => m.id !== id)
                state.managersGroupMessages = state.managersGroupMessages.filter(m => m.id !== id)
                Object.keys(state.privateChats).forEach(uid => {
                    state.privateChats[uid] = state.privateChats[uid].filter(m => m.id !== id)
                })
            })
    },
})

export const { setActiveChat, clearChat } = chatSlice.actions
export default chatSlice.reducer
