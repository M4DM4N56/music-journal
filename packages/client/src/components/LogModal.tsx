import { useState } from 'react'
import { api } from '../lib/api'

type LogModalProps = {
  itunesId: number
  onClose: () => void
  onSuccess: () => void
}

export default function LogModal({ itunesId, onClose, onSuccess }: LogModalProps) {
  const [listenedAt, setListenedAt] = useState('')
  const [isFirstListen, setIsFirstListen] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { itunesId, isFirstListen }
      if (listenedAt) body.listenedAt = listenedAt
      if (notes) body.notes = notes

      const res = await api.post('/api/diary', body)
      if (res.ok) {
        onSuccess()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '8px', padding: '24px',
          width: '100%', maxWidth: '440px', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
          aria-label='Close'
        >
          ×
        </button>
        <h2 style={{ marginTop: 0 }}>Log this album</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Date listened (optional)</span>
            <input
              type='date'
              value={listenedAt}
              onChange={(e) => setListenedAt(e.target.value)}
              style={{ padding: '6px' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type='checkbox'
              checked={isFirstListen}
              onChange={(e) => setIsFirstListen(e.target.checked)}
            />
            First listen?
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Notes ({notes.length}/2000)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
              rows={4}
              style={{ padding: '6px', resize: 'vertical' }}
            />
          </label>
          <button
            type='submit'
            disabled={submitting}
            style={{ padding: '8px 16px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Logging...' : 'Log'}
          </button>
        </form>
      </div>
    </div>
  )
}
