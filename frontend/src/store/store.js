import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import tasksReducer from './slices/tasksSlice'
import usersReducer from './slices/usersSlice'
import notificationsReducer from './slices/notificationsSlice'
import uiReducer from './slices/uiSlice'
import chatReducer from './slices/chatSlice'

export const store = configureStore({
    reducer: {
        auth:          authReducer,
        tasks:         tasksReducer,
        users:         usersReducer,
        notifications: notificationsReducer,
        ui:            uiReducer,
        chat:          chatReducer,   // ← add this
    },
})

export default store
