import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

// API URL from environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * UsersPage - User management admin page
 * - View all users with pagination
 * - Search users by nickname/email
 * - Filter by role
 * - Change user roles
 */
export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [changingRole, setChangingRole] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)

      const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch users')

      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Users fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole, oldRole) => {
    if (!confirm(`Are you sure you want to change role to "${newRole}"?`)) {
      return
    }

    try {
      setChangingRole(userId)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to update role')
      }

      // Refresh users list
      await fetchUsers()
      alert(`Role changed successfully: ${oldRole} → ${newRole}`)
    } catch (err) {
      console.error('Role change error:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setChangingRole(null)
    }
  }

  const roleColors = {
    super_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    moderator: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    user: 'bg-surface-300 text-surface-400 border-surface-400'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header + Controls */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <button
            onClick={fetchUsers}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm text-surface-400 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1) // Reset to first page on search
                }}
                placeholder="Nickname or email..."
                className="w-full bg-surface-100 border border-surface-300 rounded px-4 py-2 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm text-surface-400 mb-2">Filter by Role</label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-surface-100 border border-surface-300 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12 text-surface-400">Loading users...</div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-surface-400">No users found</div>
        ) : (
          <div className="bg-surface-200 border border-surface-300 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-300 border-b border-surface-400">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">User</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Email</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Role</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Joined</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-surface-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-300">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-300/50 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url && (
                            <img
                              src={user.avatar_url}
                              alt={user.nickname}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium text-white">{user.nickname || 'No nickname'}</div>
                            <div className="text-xs text-surface-400">{user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-surface-300">{user.email || 'N/A'}</td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-medium border ${roleColors[user.role] || roleColors.user}`}>
                          {user.role || 'user'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-sm text-surface-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.role || 'user')}
                          disabled={changingRole === user.id}
                          className="bg-surface-100 border border-surface-300 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-surface-300 border-t border-surface-400 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-surface-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-surface-100 hover:bg-surface-200 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="bg-surface-100 hover:bg-surface-200 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
