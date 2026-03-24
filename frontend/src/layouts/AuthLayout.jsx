import { Outlet, Navigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AuthLayout() {
  const { user } = useSelector(s => s.auth)
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex bg-app">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #09637e 0%, #088395 50%, #7ab2b2 100%)' }}>
        {/* Glassmorphism orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #ebf4f6 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>ITFlow</span>
          </Link>

          <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Manage your IT<br />team with clarity
          </h2>
          <p className="text-lg opacity-80 mb-10 leading-relaxed">
            Assign tasks, track progress, and keep your engineering team aligned — all in one place.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { icon: '⚡', text: 'Role-based access for admins, managers & employees' },
              { icon: '🔔', text: 'Real-time notifications when tasks are assigned or completed' },
              { icon: '📊', text: 'Dashboard analytics for full operational visibility' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center text-base shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <p className="text-sm opacity-85 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #088395, #09637e)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>ITFlow</span>
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
