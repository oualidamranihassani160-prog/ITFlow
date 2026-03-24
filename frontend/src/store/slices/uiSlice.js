import { createSlice } from '@reduxjs/toolkit'

const savedTheme = localStorage.getItem('itflow_theme') || 'light'
if (savedTheme === 'dark') document.documentElement.classList.add('dark')

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: savedTheme === 'dark',
    sidebarOpen: true,
    sidebarMobileOpen: false,
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      if (state.darkMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('itflow_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('itflow_theme', 'light')
      }
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    toggleMobileSidebar: (state) => { state.sidebarMobileOpen = !state.sidebarMobileOpen },
    closeMobileSidebar: (state) => { state.sidebarMobileOpen = false },
  },
})

export const { toggleDarkMode, toggleSidebar, toggleMobileSidebar, closeMobileSidebar } = uiSlice.actions
export default uiSlice.reducer
