import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface UserResult {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

type SearchState = 'idle' | 'loading' | 'done'

export default function UserSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [state, setState] = useState<SearchState>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (!trimmed) {
      setState('idle')
      setResults([])
      return
    }

    setState('loading')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/users/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.users ?? [])
        }
      } catch {
        setResults([])
      }
      setState('done')
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <main style={{ padding: '16px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Find users</h1>
      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search by username…'
        autoFocus
        style={{ width: '100%', maxWidth: 400, padding: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
      />

      <div style={{ marginTop: '16px' }}>
        {state === 'idle' && (
          <p style={{ color: '#6b7280' }}>Search for a user by username.</p>
        )}
        {state === 'loading' && (
          <p style={{ color: '#6b7280' }}>Searching...</p>
        )}
        {state === 'done' && results.length === 0 && (
          <p style={{ color: '#6b7280' }}>No users found.</p>
        )}
        {state === 'done' && results.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/user/${u.username}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}
                >
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      width={32}
                      height={32}
                      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#d1d5db',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '0.9rem', color: '#374151', flexShrink: 0,
                    }}>
                      {u.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{u.displayName}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
