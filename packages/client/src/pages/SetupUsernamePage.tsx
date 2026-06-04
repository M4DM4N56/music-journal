import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type CheckState = 'idle' | 'pending' | 'checking' | 'available' | 'taken' | 'invalid'

export default function SetupUsernamePage() {
  const { setUser, user } = useAuth()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [submitting, setSubmitting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!value) {
      setCheckState('idle')
      return
    }

    setCheckState('pending')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setCheckState('checking')
      try {
        const res = await api.get(`/api/users/check-username?username=${encodeURIComponent(value)}`)
        if (res.status === 400) {
          setCheckState('invalid')
          return
        }
        const data = await res.json()
        setCheckState(data.available ? 'available' : 'taken')
      } catch {
        setCheckState('idle')
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (checkState !== 'available' || submitting) return

    setSubmitting(true)
    try {
      const res = await api.patch('/api/users/me/username', { username: value })
      if (!res.ok) {
        const data = await res.json()
        setCheckState(data.error === 'Username taken' ? 'taken' : 'invalid')
        return
      }
      const data = await res.json()
      if (user) setUser({ ...user, username: data.username })
      navigate(`/user/${data.username}`, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  function statusEl() {
    switch (checkState) {
      case 'pending':
      case 'checking':
        return <span style={{ color: '#888' }}>Checking...</span>
      case 'available':
        return <span style={{ color: 'green' }}>✓ Available</span>
      case 'taken':
        return <span style={{ color: 'red' }}>✗ Taken</span>
      case 'invalid':
        return <span style={{ color: 'red' }}>✗ Invalid format</span>
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '320px' }}
      >
        <h2 style={{ margin: 0 }}>Choose a username</h2>
        <input
          type='text'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='username'
          autoFocus
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <div style={{ minHeight: '1.25rem', fontSize: '0.875rem' }}>{statusEl()}</div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
          3–20 characters. Letters, numbers, and underscores only.
        </p>
        <button
          type='submit'
          disabled={checkState !== 'available' || submitting}
          style={{ padding: '0.5rem', fontSize: '1rem', cursor: checkState === 'available' ? 'pointer' : 'not-allowed' }}
        >
          {submitting ? 'Saving...' : 'Set username'}
        </button>
      </form>
    </div>
  )
}
