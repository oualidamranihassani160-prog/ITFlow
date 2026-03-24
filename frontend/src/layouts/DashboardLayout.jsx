import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeMobileSidebar } from '../store/slices/uiSlice'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

export default function DashboardLayout() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { sidebarOpen, sidebarMobileOpen } = useSelector(s => s.ui)

  // Close mobile sidebar on route change
  useEffect(() => {
    dispatch(closeMobileSidebar())
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
