import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page, last_page, total, per_page } = meta
  const from = (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)

  const pages = []
  const delta = 2
  for (let i = Math.max(1, current_page - delta); i <= Math.min(last_page, current_page + delta); i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between gap-4 mt-4">
      <p className="text-xs text-app-muted">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className="p-1.5 rounded-md border border-app text-app-secondary hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-2.5 py-1 rounded-md text-xs border border-app text-app-secondary hover:border-primary-400 hover:text-primary-600 transition-colors">1</button>
            {pages[0] > 2 && <span className="text-app-muted text-xs px-1">…</span>}
          </>
        )}

        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${p === current_page
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'border-app text-app-secondary hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < last_page && (
          <>
            {pages[pages.length - 1] < last_page - 1 && <span className="text-app-muted text-xs px-1">…</span>}
            <button onClick={() => onPageChange(last_page)} className="px-2.5 py-1 rounded-md text-xs border border-app text-app-secondary hover:border-primary-400 hover:text-primary-600 transition-colors">{last_page}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className="p-1.5 rounded-md border border-app text-app-secondary hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
