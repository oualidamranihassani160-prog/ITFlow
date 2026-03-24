import { getInitials } from '../../utils/helpers'

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-16 h-16 text-xl' }
  const s = sizes[size] || sizes.md

  if (src) {
    return <img src={src} alt={name} className={`${s} rounded-full object-cover shrink-0 ${className}`} />
  }

  return (
    <div
      className={`${s} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
      style={{ background: 'linear-gradient(135deg, #088395, #09637e)' }}
    >
      {getInitials(name)}
    </div>
  )
}
