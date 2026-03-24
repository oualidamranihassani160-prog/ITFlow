import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Search, Users } from 'lucide-react'
import { fetchUsers } from '../../store/slices/usersSlice'
import UserRow from '../../components/users/UserRow'
import Modal from '../../components/ui/Modal'
import UserForm from '../../components/users/UserForm'
import Pagination from '../../components/ui/Pagination'

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
]

export default function UsersPage() {
  const dispatch = useDispatch()
  const { items: users, meta, loading } = useSelector(s => s.users)

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(() => {
    dispatch(fetchUsers({ search, role, page, per_page: 15 }))
  }, [search, role, page])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>Users</h1>
          <p className="text-app-secondary text-sm mt-0.5">{meta?.total ?? 0} total users</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> New Manager
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <input
            className="input-field pl-9"
            placeholder="Search users…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input-field w-auto min-w-36" value={role} onChange={e => { setRole(e.target.value); setPage(1) }}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app">
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Salary</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Hire Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-app">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900" />
                        <div>
                          <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-28 mb-1" />
                          <div className="h-2.5 bg-primary-100 dark:bg-primary-900 rounded w-36" />
                        </div>
                      </div>
                    </td>
                    {[1, 2, 3, 4].map(j => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-16 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Users size={32} className="text-app-muted mx-auto mb-2" />
                    <p className="text-app-muted text-sm">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map(u => <UserRow key={u.id} user={u} />)
              )}
            </tbody>
          </table>
        </div>
        {!loading && <div className="px-4 pb-4"><Pagination meta={meta} onPageChange={setPage} /></div>}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Manager">
        <UserForm role="manager" onClose={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
