'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditEntitlementButton({ profile, entitlement }: { profile: any; entitlement: any }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    total_days:    String(entitlement?.total_days   || 28),
    bank_holidays: String(entitlement?.bank_holidays || 8),
    carried_over:  String(entitlement?.carried_over  || 0),
  })
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/entitlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: profile.id, ...form }),
    })
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-oxford font-medium hover:underline">Edit</button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <h2 className="font-display font-bold text-oxford text-xl mb-1">Edit Entitlement</h2>
            <p className="text-gray-500 text-sm mb-6">{profile.name} — {new Date().getFullYear()}</p>

            <form onSubmit={submit} className="space-y-4">
              {[
                { key: 'total_days', label: 'Annual leave days' },
                { key: 'bank_holidays', label: 'Bank holidays' },
                { key: 'carried_over', label: 'Carried over days' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input className="input" type="number" min="0" step="0.5"
                         value={form[key as keyof typeof form]}
                         onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Saving…' : 'Save'}
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
