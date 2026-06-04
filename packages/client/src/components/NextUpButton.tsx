import { useState } from 'react'
import { api } from '../lib/api'

interface NextUpButtonProps {
  itunesId: number
  initialNextUp: boolean
}

export default function NextUpButton({ itunesId, initialNextUp }: NextUpButtonProps) {
  const [nextUp, setNextUp] = useState(initialNextUp)
  const [saving, setSaving] = useState(false)

  async function handleClick() {
    if (saving) return
    setSaving(true)
    const next = !nextUp
    try {
      const res = await api.post('/api/status', { itunesId, nextUp: next })
      if (!res.ok) throw new Error()
      setNextUp(next)
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  const activeStyle: React.CSSProperties = {
    backgroundColor: '#d97706',
    color: 'white',
    border: '1px solid #d97706',
  }
  const inactiveStyle: React.CSSProperties = {
    backgroundColor: 'white',
    color: '#d97706',
    border: '1px solid #d97706',
  }

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      style={{
        ...(nextUp ? activeStyle : inactiveStyle),
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: saving ? 'default' : 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {saving ? '...' : nextUp ? '🔖 In Next Up' : '🔖 Add to Next Up'}
    </button>
  )
}
