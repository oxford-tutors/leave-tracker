'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddEmployeeButton() {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ name:'', email:'', role:'employee', department:'', total_days:'28' })
  const router = useRouter()

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res  = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false) }
    else { setOpen(false); setForm({ name:'', email:'', role:'employee', department:'', total_days:'28' }); router.refresh() }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ Add Employee</button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="font-display font-bold text-oxford text-xl mb-1">Add Employee</h2>
            <p className="text-gray-500 text-sm mb-6">They'll receive an invite email to set their password.</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input className="input" placeholder="Jane Smith" value={form.name}
                       onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input className="input" type="email" placeholder="jane.smith@oxfordtutors.com"
                       value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days entitlement</label>
                  <input className="input" type="number" min="0" max="365" value={form.total_days}
                         onChange={e => set('total_days', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input className="input" placeholder="e.g. Tutoring, Operations"
                       value={form.department} onChange={e => set('department', e.target.value)} required />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Sending invite…' : 'Send invite'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
