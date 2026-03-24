import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { fetchMe } from './store/slices/authSlice'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'

// Public pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ChatPage from './pages/ChatPage'

// Dashboard pages
import AdminDashboard from './pages/dashboard/AdminDashboard'
import ManagerDashboard from './pages/dashboard/ManagerDashboard'
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard'

// User management
import UsersPage from './pages/users/UsersPage'
import EmployeesPage from './pages/users/EmployeesPage'

// Task management
import TasksPage from './pages/tasks/TasksPage'
import TaskBoardPage from './pages/tasks/TaskBoardPage'

// Profile
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import ArchivedPage from './pages/ArchivedPage'

// Guards
import PrivateRoute from './components/guards/PrivateRoute'
import RoleRoute from './components/guards/RoleRoute'

function DashboardRedirect() {
  const { user } = useSelector(s => s.auth)
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />
  if (user.role === 'manager') return <Navigate to="/dashboard/manager" replace />
  return <Navigate to="/dashboard/employee" replace />
}

export default function App() {
  const dispatch = useDispatch()
  const { token, initialized } = useSelector(s => s.auth)

  useEffect(() => {
    if (token) dispatch(fetchMe())
    else {
      // mark as initialized with no token
      dispatch({ type: 'auth/me/rejected' })
    }
  }, [])

  if (!initialized && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-app-secondary text-sm font-medium">Loading ITFlow…</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Dashboard */}
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Admin */}
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/users" element={<UsersPage />} />
            <Route path="/dashboard/archived" element={<ArchivedPage />} />
          </Route>

          {/* Manager */}
          <Route element={<RoleRoute roles={['manager']} />}>
            <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            <Route path="/dashboard/employees" element={<EmployeesPage />} />
          </Route>

          {/* Employee */}
          <Route element={<RoleRoute roles={['employee']} />}>
            <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
          </Route>

          {/* Shared */}
          <Route path="/dashboard/tasks" element={<TasksPage />} />
          <Route path="/dashboard/board" element={<TaskBoardPage />} />
          <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />

          {/* chat */}
          <Route path="/dashboard/chat" element={<ChatPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
