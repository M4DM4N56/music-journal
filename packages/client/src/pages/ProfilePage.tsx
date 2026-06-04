import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type ProfileUser = { id: string; displayName: string; avatarUrl: string | null }
type Stats = { totalRatings: number; averageRating: number | null; totalDiaryEntries: number }
type AlbumSnippet = { itunesId: number; title: string; coverArtUrl: string | null; artistName: string }
type RecentRating = { id: string; score: number; updatedAt: string; album: AlbumSnippet }
type RecentEntry = { id: string; listenedAt: string | null; createdAt: string; album: AlbumSnippet }

const thumbStyle: React.CSSProperties = { width: 48, height: 48, objectFit: 'cover', flexShrink: 0 }
const placeholderStyle: React.CSSProperties = { ...thumbStyle, background: '#ccc' }

function Thumb({ url, alt }: { url: string | null; alt: string }) {
  return url ? <img src={url} alt={alt} style={thumbStyle} /> : <div style={placeholderStyle} />
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser } = useAuth()
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRatings, setRecentRatings] = useState<RecentRating[]>([])
  const [recentDiaryEntries, setRecentDiaryEntries] = useState<RecentEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (!username) return
    setStatus('loading')
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then((res) => {
        if (res.status === 404) { setStatus('notfound'); return null }
        if (!res.ok) { setStatus('error'); return null }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setProfileUser(data.user)
        setStats(data.stats)
        setRecentRatings(data.recentRatings)
        setRecentDiaryEntries(data.recentDiaryEntries)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [username])

  if (status === 'loading') return <main style={{ padding: '16px' }}><p>Loading...</p></main>
  if (status === 'notfound') return <main style={{ padding: '16px' }}><p>User not found</p></main>
  if (status === 'error') return <main style={{ padding: '16px' }}><p>Something went wrong</p></main>
  if (!profileUser || !stats) return null

  const isOwn = authUser?.id === profileUser.id

  return (
    <main style={{ padding: '16px', maxWidth: '640px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        {profileUser.avatarUrl ? (
          <img
            src={profileUser.avatarUrl}
            alt={profileUser.displayName}
            width={64} height={64}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#888',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0,
          }}>
            {profileUser.displayName[0].toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0 }}>{profileUser.displayName}</h1>
          {isOwn && (
            <span style={{ fontSize: '0.75em', background: '#e8f4fd', color: '#1a73e8', padding: '2px 8px', borderRadius: '10px' }}>
              This is you
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
        {[
          { label: 'Albums rated', value: stats.totalRatings },
          { label: 'Avg rating', value: stats.averageRating !== null ? stats.averageRating.toFixed(1) : '—' },
          { label: 'Listens logged', value: stats.totalDiaryEntries },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent ratings */}
      <section style={{ marginBottom: '32px' }}>
        <h2>Recent ratings</h2>
        {recentRatings.length === 0 ? (
          <p style={{ color: '#666' }}>No ratings yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recentRatings.map((r) => (
              <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Thumb url={r.album.coverArtUrl} alt={r.album.title} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/album/${r.album.itunesId}`} style={{ color: 'inherit', fontWeight: 500 }}>
                    {r.album.title}
                  </Link>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>{r.album.artistName}</div>
                </div>
                <strong style={{ flexShrink: 0 }}>{r.score}/10</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent diary */}
      <section>
        <h2>Recent listens</h2>
        {recentDiaryEntries.length === 0 ? (
          <p style={{ color: '#666' }}>No listens logged yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recentDiaryEntries.map((e) => (
              <li key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Thumb url={e.album.coverArtUrl} alt={e.album.title} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/album/${e.album.itunesId}`} style={{ color: 'inherit', fontWeight: 500 }}>
                    {e.album.title}
                  </Link>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>{e.album.artistName}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: '0.85em', color: '#666' }}>
                  {e.listenedAt ? e.listenedAt.slice(0, 10) : 'No date'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
