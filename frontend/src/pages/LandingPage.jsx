import { Link } from 'react-router-dom'
import { useState } from 'react'
import { CheckCircle, Users, Bell, BarChart3, Shield, Zap, ArrowRight, Menu, X } from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16"
        style={{ background: 'rgba(235,244,246,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(9,99,126,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #088395, #09637e)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#09637e' }}>ITFlow</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'About', 'Contact'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm font-medium transition-colors"
              style={{ color: '#4a7a8a' }}
              onMouseEnter={e => e.target.style.color = '#09637e'}
              onMouseLeave={e => e.target.style.color = '#4a7a8a'}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#09637e' }}>
            Sign In
          </Link>
          <Link to="/register"
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #088395, #09637e)', boxShadow: '0 2px 8px rgba(8,131,149,0.35)' }}>
            Get Started
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(v => !v)} style={{ color: '#09637e' }}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 p-4 flex flex-col gap-2 md:hidden"
          style={{ background: '#ebf4f6', borderBottom: '1px solid rgba(9,99,126,0.1)' }}>
          {['Features', 'About', 'Contact'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: '#4a7a8a' }}
              onClick={() => setMobileMenuOpen(false)}>
              {item}
            </a>
          ))}
          <Link to="/login" className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ color: '#09637e' }}>Sign In</Link>
          <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-lg text-white text-center"
            style={{ background: 'linear-gradient(135deg, #088395, #09637e)' }}>
            Get Started
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16"
        style={{ background: 'linear-gradient(160deg, #ebf4f6 0%, #d9f0f3 40%, #b3e1e8 100%)' }}>
        {/* Decorative glass orbs */}
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #088395 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #09637e 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7ab2b2 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(8,131,149,0.1)', color: '#088395', border: '1px solid rgba(8,131,149,0.2)' }}>
              <Zap size={12} /> Streamlined IT Operations
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
              style={{ fontFamily: 'Syne, sans-serif', color: '#09637e', lineHeight: 1.1 }}>
              Manage IT Teams<br />
              <span style={{ color: '#088395' }}>Like a Pro</span>
            </h1>
            <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: '#4a7a8a' }}>
              Assign tasks, track progress in real time, and keep your entire engineering organization aligned — all with a clean, role-based dashboard.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register"
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #088395, #09637e)', boxShadow: '0 4px 20px rgba(8,131,149,0.4)' }}>
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link to="/register?admin=true"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(9,99,126,0.2)', color: '#09637e', boxShadow: '0 2px 12px rgba(9,99,126,0.1)' }}>
                <Shield size={16} /> Sign Up as Admin
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-10">
              {[['500+', 'Teams'], ['50k+', 'Tasks done'], ['99.9%', 'Uptime']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif', color: '#09637e' }}>{num}</p>
                  <p className="text-xs font-medium" style={{ color: '#7ab2b2' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Glass dashboard preview */}
          <div className="hidden lg:block relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)' }}>
              {/* Fake topbar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(9,99,126,0.1)' }}>
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4 h-5 rounded-full" style={{ background: 'rgba(9,99,126,0.08)' }} />
              </div>
              <div className="flex">
                {/* Fake sidebar */}
                <div className="w-12 flex flex-col gap-3 p-3" style={{ background: '#09637e' }}>
                  {[BarChart3, Users, CheckCircle, Bell].map((Icon, i) => (
                    <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-white/20' : ''}`}>
                      <Icon size={14} color="rgba(255,255,255,0.7)" />
                    </div>
                  ))}
                </div>
                {/* Fake content */}
                <div className="flex-1 p-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[['Managers', '8', '#088395'], ['Employees', '34', '#7ab2b2'], ['Tasks', '127', '#09637e']].map(([label, val, color]) => (
                      <div key={label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.5)' }}>
                        <p className="text-xs font-medium" style={{ color: '#7ab2b2' }}>{label}</p>
                        <p className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg p-3 mb-2" style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#09637e' }}>Recent Tasks</p>
                    {[['Set up CI/CD pipeline', 'completed'], ['API documentation', 'in_progress'], ['Database optimization', 'pending']].map(([title, status]) => (
                      <div key={title} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(9,99,126,0.08)' }}>
                        <span className="text-xs" style={{ color: '#4a7a8a' }}>{title}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: status === 'completed' ? '#d1fae5' : status === 'in_progress' ? '#dbeafe' : '#fef3c7',
                            color: status === 'completed' ? '#059669' : status === 'in_progress' ? '#2563eb' : '#d97706',
                          }}>
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 lg:px-12" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: '#09637e' }}>
              Everything your IT team needs
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#4a7a8a' }}>
              From task assignment to completion tracking, ITFlow handles your entire IT workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Role-Based Access', desc: 'Admin, Manager, and Employee roles with granular permissions. Each user sees exactly what they need.', color: '#09637e' },
              { icon: CheckCircle, title: 'Task Management', desc: 'Create, assign, and track tasks with priority levels, due dates, and real-time status updates.', color: '#088395' },
              { icon: Bell, title: 'Smart Notifications', desc: 'Instant notifications when tasks are assigned or completed. Never miss an update again.', color: '#7ab2b2' },
              { icon: Users, title: 'Team Hierarchy', desc: 'Managers oversee their employees, admins have full visibility. Clean organizational structure.', color: '#09637e' },
              { icon: BarChart3, title: 'Dashboard Analytics', desc: 'Track team performance with at-a-glance stats on tasks, team size, and completion rates.', color: '#088395' },
              { icon: Zap, title: 'Kanban Board', desc: 'Drag-and-drop task board inspired by Jira. Visualize your workflow from pending to completed.', color: '#7ab2b2' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: '#e0eff2', background: '#fafeff' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#09637e' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#4a7a8a' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 lg:px-12" style={{ background: 'linear-gradient(135deg, #ebf4f6, #d9f0f3)' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-extrabold mb-6" style={{ fontFamily: 'Syne, sans-serif', color: '#09637e' }}>
              Built for IT teams<br />that move fast
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#4a7a8a' }}>
              ITFlow is designed around the realities of IT project management. Whether you're managing a small dev team or a large enterprise IT department, our role-based system scales with you.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                'First registered user automatically becomes Admin',
                'Admins create and manage Managers across the org',
                'Managers create employees and assign targeted tasks',
                'Employees receive notifications and update task status',
                'Full audit trail with soft-delete and restore capabilities',
              ].map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#088395' }} />
                  <span className="text-sm" style={{ color: '#4a7a8a' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { role: '🛡️ Admin', color: '#09637e', desc: 'Full system access. Manage all managers, employees, and tasks from a single command center.' },
              { role: '👨‍💼 Manager', color: '#088395', desc: 'Create and manage your team. Assign tasks, track progress, and get notified on completion.' },
              { role: '👨‍💻 Employee', color: '#7ab2b2', desc: 'View assigned tasks, update status, and receive instant notifications for new assignments.' },
            ].map(({ role, color, desc }) => (
              <div key={role} className="p-5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: color }}>{role}</div>
                </div>
                <p className="text-sm" style={{ color: '#4a7a8a' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #09637e, #088395)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ready to streamline your IT team?
          </h2>
          <p className="text-lg opacity-85 mb-8">
            Join thousands of IT teams who trust ITFlow for task management.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-1"
              style={{ background: 'white', color: '#09637e', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-10 px-6 lg:px-12" style={{ background: '#09637e' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>ITFlow</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(122,178,178,0.8)' }}>
            © {new Date().getFullYear()} ITFlow. Modern IT task management for engineering teams.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support'].map(item => (
              <a key={item} href="#" className="text-xs transition-colors"
                style={{ color: 'rgba(122,178,178,0.8)' }}
                onMouseEnter={e => e.target.style.color = 'white'}
                onMouseLeave={e => e.target.style.color = 'rgba(122,178,178,0.8)'}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
