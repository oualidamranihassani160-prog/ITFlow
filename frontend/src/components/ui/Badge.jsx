export function StatusBadge({ status }) {
  const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' }
  return <span className={`badge-${status}`}>{labels[status] || status}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={`badge-${priority}`}>{priority}</span>
}

export function RoleBadge({ role }) {
  const styles = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    employee: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[role] || ''}`}>
      {role}
    </span>
  )
}
