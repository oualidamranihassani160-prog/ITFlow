export default function StatCard({ label, value, icon: Icon, color = 'primary', trend }) {
  const colors = {
    primary: { bg: 'bg-primary-50 dark:bg-primary-950/40', icon: 'text-primary-600 dark:text-primary-400', border: 'border-primary-100 dark:border-primary-900' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900' },
    yellow: { bg: 'bg-amber-50 dark:bg-amber-950/40', icon: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900' },
    red: { bg: 'bg-red-50 dark:bg-red-950/40', icon: 'text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-900' },
  }
  const c = colors[color] || colors.primary

  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-app-lg transition-shadow duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg} border ${c.border}`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-app-muted text-xs font-medium uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-bold text-app-primary mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  )
}
