import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
          />

          {/* Modal box */}
          <div className={`relative w-full ${sizes[size]} bg-card rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-app shrink-0">
                  <h2 className="text-base font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {title}
                  </h2>
                  <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-app-muted hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                  >
                      <X size={16} />
                  </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-6 py-4 scrollbar-thin">
                  {children}
              </div>

          </div>
      </div>
  )
}
