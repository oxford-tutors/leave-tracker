'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveButtons({ requestId, employeeName, employeeEmail }: {
  requestId: string; employeeName: string; employeeEmail?: string
}) {
  const [loading, setLoading] = useState<'approved'|'rejected'|null>(null)
  const router = useRouter()

  async function respond(action: 'approved'|'rejected') {
    if (action === 'rejected' && !confirm(`Reject this request from ${employeeName}?`)) return
    setLoading(action)
    await fetch('/api/admin/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, action }),
    })
    router.refresh()
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={() => respond('approved')} disabled={!!loading}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg
                         hover:bg-emerald-700 disabled:opacity-50 transition-colors">
        {loading === 'approved' ? '…' : 'Approve'}
      </button>
      <button onClick={() => respond('rejected')} disabled={!!loading}
              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg
                         hover:bg-red-200 disabled:opacity-50 transition-colors">
        {loading === 'rejected' ? '…' : 'Reject'}
      </button>
    </div>
  )
}
