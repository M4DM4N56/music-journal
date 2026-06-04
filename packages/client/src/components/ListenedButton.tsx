import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

interface ListenedButtonProps {
  itunesId: number
  initialListened: boolean
}

export default function ListenedButton({ itunesId, initialListened }: ListenedButtonProps) {
  const [listened, setListened] = useState(initialListened)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (errorTimer.current) clearTimeout(errorTimer.current) }, [])

  async function handleClick() {
    if (saving) return
    setSaving(true)
    setError(null)
    const next = !listened
    try {
      const res = await api.post('/api/status', { itunesId, listened: next })
      if (!res.ok) throw new Error()
      setListened(next)
    } catch {
      setError('Failed')
      errorTimer.current = setTimeout(() => setError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const activeStyle: React.CSSProperties = {
    backgroundColor: '#16a34a',
    color: 'white',
    border: '1px solid #16a34a',
  }
  const inactiveStyle: React.CSSProperties = {
    backgroundColor: 'white',
    color: '#16a34a',
    border: '1px solid #16a34a',
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={saving}
        style={{
          ...(listened ? activeStyle : inactiveStyle),
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: saving ? 'default' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {saving ? '...' : listened ? '✓ Listened' : 'Mark as listened'}
      </button>
      {error && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{error}</div>}
    </div>
  )
}
