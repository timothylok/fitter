'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'

interface Profile { id: string; name: string; email: string; avatar_style: string | null; avatar_seed: string | null }
interface Assignment { id: string; user_id: string; trainer_id: string }

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [trainers, setTrainers] = useState<Profile[]>([])
  const [admins, setAdmins] = useState<Profile[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (prof?.role !== 'admin') { router.replace('/dashboard'); return }

      const res = await fetch('/api/admin/assignments', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); setReady(true); return }

      setUsers(json.data.users)
      setTrainers(json.data.trainers)
      setAdmins(json.data.admins)
      setAssignments(json.data.assignments)
      setReady(true)
    }
    init()
  }, [router])

  async function handleAdd(user_id: string, trainer_id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ user_id, trainer_id }),
    })
    const json = await res.json()
    if (json.success) setAssignments(a => [...a, json.data])
  }

  async function handleRemove(assignmentId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = await res.json()
    if (json.success) setAssignments(a => a.filter(x => x.id !== assignmentId))
  }

  async function handleDeleteUser(userId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = await res.json()
    if (json.success) {
      setUsers(u => u.filter(p => p.id !== userId))
      setAssignments(a => a.filter(x => x.user_id !== userId))
      setConfirmDeleteId(null)
    } else {
      setError(json.error)
      setConfirmDeleteId(null)
    }
  }

  async function handleRename(profileId: string) {
    const name = editName.trim()
    if (!name) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/admin/users/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name }),
    })
    const json = await res.json()
    if (json.success) {
      setUsers(u => u.map(p => p.id === profileId ? { ...p, name } : p))
      setTrainers(t => t.map(p => p.id === profileId ? { ...p, name } : p))
      setAdmins(a => a.map(p => p.id === profileId ? { ...p, name } : p))
      setEditingId(null)
    }
  }

  if (!ready) return <Spinner />

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold">Admin — Trainer Assignments</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">{error}</div>
        )}

        {trainers.length === 0 && (
          <p className="text-sm text-gray-400">No trainers found. Set a user&apos;s role to <code>trainer</code> in Supabase first.</p>
        )}

        {users.length === 0 && !error && (
          <p className="text-gray-400 text-center py-16">No users found.</p>
        )}

        {users.map(user => {
          const userAssignments = assignments.filter(a => a.user_id === user.id)
          const assignedTrainerIds = new Set(userAssignments.map(a => a.trainer_id))
          const available = trainers.filter(t => !assignedTrainerIds.has(t.id))
          const isEditing = editingId === user.id

          const isConfirmingDelete = confirmDeleteId === user.id

          return (
            <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar style={user.avatar_style} seed={user.avatar_seed} name={user.name} size={40} />
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(user.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="border border-gray-300 rounded px-2 py-0.5 text-sm font-medium w-40 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <button onClick={() => handleRename(user.id)} className="text-green-600 hover:text-green-700 text-sm">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Remove <span className="font-medium">{user.name}</span>?</span>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Remove</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{user.name}</p>
                      <button
                        onClick={() => { setEditingId(user.id); setEditName(user.name) }}
                        className="text-gray-300 hover:text-gray-600 text-xs"
                        aria-label="Edit name"
                      >✎</button>
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="text-gray-300 hover:text-red-500 text-xs"
                        aria-label="Remove user"
                      >🗑</button>
                    </div>
                  )}
                  <p className="text-sm text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {userAssignments.length === 0 && (
                  <span className="text-sm text-gray-400">No trainers assigned</span>
                )}
                {userAssignments.map(a => {
                  const trainer = trainers.find(t => t.id === a.trainer_id)
                  return (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-2.5 py-1 rounded-full"
                    >
                      {trainer?.name ?? 'Unknown'}
                      <button
                        onClick={() => handleRemove(a.id)}
                        className="text-gray-400 hover:text-red-500 leading-none ml-0.5"
                        aria-label={`Remove ${trainer?.name}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}

                {available.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleAdd(user.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="text-sm border border-gray-300 rounded-full px-3 py-1 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="" disabled>+ Add trainer</option>
                    {available.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )
        })}

        {trainers.length > 0 && (
          <>
            <h2 className="text-lg font-semibold pt-4">Trainers</h2>
            {trainers.map(trainer => {
              const isEditing = editingId === trainer.id
              return (
                <div key={trainer.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar style={trainer.avatar_style} seed={trainer.avatar_seed} name={trainer.name} size={40} />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(trainer.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="border border-gray-300 rounded px-2 py-0.5 text-sm font-medium w-40 focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                          <button onClick={() => handleRename(trainer.id)} className="text-green-600 hover:text-green-700 text-sm">✓</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{trainer.name}</p>
                          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Trainer</span>
                          <button
                            onClick={() => { setEditingId(trainer.id); setEditName(trainer.name) }}
                            className="text-gray-300 hover:text-gray-600 text-xs"
                            aria-label="Edit name"
                          >✎</button>
                        </div>
                      )}
                      <p className="text-sm text-gray-400 truncate">{trainer.email}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {admins.length > 0 && (
          <>
            <h2 className="text-lg font-semibold pt-4">Admins</h2>
            {admins.map(admin => {
              const isEditing = editingId === admin.id
              return (
                <div key={admin.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar style={admin.avatar_style} seed={admin.avatar_seed} name={admin.name} size={40} />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(admin.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="border border-gray-300 rounded px-2 py-0.5 text-sm font-medium w-40 focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                          <button onClick={() => handleRename(admin.id)} className="text-green-600 hover:text-green-700 text-sm">✓</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{admin.name}</p>
                          <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
                          <button
                            onClick={() => { setEditingId(admin.id); setEditName(admin.name) }}
                            className="text-gray-300 hover:text-gray-600 text-xs"
                            aria-label="Edit name"
                          >✎</button>
                        </div>
                      )}
                      <p className="text-sm text-gray-400 truncate">{admin.email}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
