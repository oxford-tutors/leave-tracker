'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function cancel() {
    if (!confirm('Cancel this leave request?')) return
    setLoading(true)
    await fetch('/api/leave/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <button onClick={cancel} disabled={loading}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
      {loading ? '…' : 'Cancel'}
    </button>
  )
}
