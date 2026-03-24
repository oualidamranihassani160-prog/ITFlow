import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Search, UserCheck } from 'lucide-react'
import { fetchMyEmployees } from '../../store/slices/usersSlice'
import UserRow from '../../components/users/UserRow'
import Modal from '../../components/ui/Modal'
import UserForm from '../../components/users/UserForm'
import Pagination from '../../components/ui/Pagination'

export default function EmployeesPage() {
  const dispatch = useDispatch()
  const { employees, employeesMeta, loading } = useSelector(s => s.users)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(() => {
    dispatch(fetchMyEmployees({ search, page, per_page: 15 }))
  }, [search, page])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-primary" style={{ fontFamily: 'Syne, sans-serif' }}>My Employees</h1>
          <p className="text-app-secondary text-sm mt-0.5">{employeesMeta?.total ?? 0} employees in your team</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <input
            className="input-field pl-9"
            placeholder="Search employees…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app">
                <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wide">Employee</th>
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-app animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900" />
                        <div>
                          <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-28 mb-1" />
                          <div className="h-2.5 bg-primary-100 dark:bg-primary-900 rounded w-36" />
                        </div>
                      </div>
                    </td>
                    {[1,2,3,4].map(j => <td key={j} className="px-4 py-3"><div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-16" /></td>)}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <UserCheck size={32} className="text-app-muted mx-auto mb-2" />
                    <p className="text-app-muted text-sm mb-3">No employees in your team yet</p>
                    <button onClick={() => setCreateOpen(true)} className="btn-primary mx-auto">
                      <Plus size={14} /> Add your first employee
                    </button>
                  </td>
                </tr>
              ) : (
                employees.map(emp => <UserRow key={emp.id} user={emp} />)
              )}
            </tbody>
          </table>
        </div>
        {!loading && <div className="px-4 pb-4"><Pagination meta={employeesMeta} onPageChange={setPage} /></div>}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Employee">
        <UserForm role="employee" onClose={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
