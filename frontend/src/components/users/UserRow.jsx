import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Edit2, Trash2, RotateCcw, Trash, Eye } from 'lucide-react'
import { deleteUser, restoreUser, forceDeleteUser } from '../../store/slices/usersSlice'
import { RoleBadge } from '../ui/Badge'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import UserForm from './UserForm'
import UserDetails from './UserDetails'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function UserRow({ user, showActions = true, isArchived = false }) {
  const dispatch = useDispatch()
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Archive ${user.name}?`)) return
    const r = await dispatch(deleteUser(user.hash_id ?? user.id))
    if (!r.error) toast.success('User archived')
    else toast.error('Failed to archive')
  }

  const handleRestore = async () => {
    const r = await dispatch(restoreUser(user.hash_id ?? user.id))
    if (!r.error) toast.success('User restored')
    else toast.error('Failed to restore')
  }

  const handleForceDelete = async () => {
    if (!confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return
    const r = await dispatch(forceDeleteUser(user.hash_id ?? user.id))
    if (!r.error) toast.success('User permanently deleted')
    else toast.error('Failed to delete')
  }

  return (
    <>
      <tr className="border-b border-app hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-colors group">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-app-primary">{user.name}</p>
              <p className="text-xs text-app-muted">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <RoleBadge role={user.role} />
        </td>
        <td className="px-4 py-3 text-xs text-app-secondary">{user.phone_number || '—'}</td>
        <td className="px-4 py-3 text-xs text-app-muted">{formatDate(user.created_at)}</td>
        <td className="px-4 py-3 text-xs text-app-secondary">
              {user.salary
                  ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {Number(user.salary).toLocaleString('fr-MA')} MAD
                    </span>
                  : '—'
              }
          </td>
          <td className="px-4 py-3 text-xs text-app-muted">
              {user.hire_date ? formatDate(user.hire_date) : '—'}
          </td>
        {showActions && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                  onClick={() => setDetailsOpen(true)}
                  className="p-1.5 rounded-md text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                  title="More details"
              >
                  <Eye size={14} />
              </button>
              {isArchived ? (
                <>
                  <button onClick={handleRestore} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors" title="Restore">
                    <RotateCcw size={14} />
                  </button>
                  <button onClick={handleForceDelete} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" title="Delete permanently">
                    <Trash size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-md text-app-secondary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={handleDelete} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" title="Archive">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </td>
        )}
      </tr>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${user.role}`}>
        <UserForm user={user} role={user.role} onClose={() => setEditOpen(false)} />
      </Modal>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Employee Details" size="xl">
        <UserDetails user={user} />
      </Modal>
    </>
  )
}
