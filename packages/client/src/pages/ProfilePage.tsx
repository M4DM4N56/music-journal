import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import AlbumGrid from '../components/AlbumGrid'
import type { Album } from '../types/album'

type ProfileUser = { id: string; displayName: string; avatarUrl: string | null }
type Stats = { totalListened: number; averageRating: number | null; totalDiaryEntries: number }

interface DiaryEntry {
  id: string
  listenedAt: string | null
  isFirstListen: boolean
  notes: string | null
  createdAt: string
  album: {
    itunesId: number
    title: string
    artistName: string
    artistId: number
    coverArtUrl: string | null
  }
}

type TabData =
  | { tab: 'activity'; entries: DiaryEntry[] }
  | { tab: 'listened'; albums: Album[] }
  | { tab: 'nextup'; albums: Album[] }

const VALID_TABS = ['activity', 'listened', 'nextup'] as const
type Tab = (typeof VALID_TABS)[number]

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawTab = searchParams.get('tab') ?? 'activity'
  const activeTab: Tab = (VALID_TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : 'activity'

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [tabData, setTabData] = useState<TabData | null>(null)
  const [pageStatus, setPageStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (!username) return
    setPageStatus('loading')
    api.get(`/api/users/${encodeURIComponent(username)}?tab=${activeTab}`)
      .then((res) => {
        if (res.status === 404) { setPageStatus('notfound'); return null }
        if (!res.ok) { setPageStatus('error'); return null }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setProfileUser(data.user)
        setStats(data.stats)
        setTabData(data as TabData)
        setPageStatus('ok')
      })
      .catch(() => setPageStatus('error'))
  }, [username, activeTab])

  if (pageStatus === 'loading') return <main style={{ padding: '16px' }}><p>Loading...</p></main>
  if (pageStatus === 'notfound') return <main style={{ padding: '16px' }}><p>User not found.</p></main>
  if (pageStatus === 'error') return <main style={{ padding: '16px' }}><p>Something went wrong.</p></main>
  if (!profileUser || !stats || !tabData) return null

  const isOwn = authUser?.id === profileUser.id

  return (
    <main style={{ padding: '16px', maxWidth: '700px' }}>
      {/* User header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        {profileUser.avatarUrl ? (
          <img
            src={profileUser.avatarUrl}
            alt={profileUser.displayName}
            width={48}
            height={48}
            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: '#d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#374151', fontWeight: 'bold', fontSize: '1.25rem', flexShrink: 0,
          }}>
            {profileUser.displayName[0].toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0 }}>{profileUser.displayName}</h1>
          {isOwn && (
            <span style={{ fontSize: '0.75rem', background: '#e8f4fd', color: '#1a73e8', padding: '2px 8px', borderRadius: '10px' }}>
              This is you
            </span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '32px', margin: '16px 0' }}>
        <span><strong>{stats.totalListened}</strong> listened</span>
        <span><strong>{stats.averageRating ?? '—'}</strong> avg rating</span>
        <span><strong>{stats.totalDiaryEntries}</strong> diary entries</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        {(['activity', 'listened', 'nextup'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSearchParams({ tab })}
            style={{
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #111' : '2px solid transparent',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            {tab === 'activity' ? 'Activity' : tab === 'listened' ? 'Listened' : 'Next Up'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabData.tab === 'activity' && (
        <div>
          {tabData.entries.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No activity yet.</p>
          ) : (
            tabData.entries.map((entry) => (
              <div
                key={entry.id}
                style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}
              >
                {entry.album.coverArtUrl ? (
                  <img
                    src={entry.album.coverArtUrl}
                    alt={entry.album.title}
                    width={48}
                    height={48}
                    style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 4, background: '#d1d5db', flexShrink: 0 }} />
                )}
                <div>
                  <div>
                    <Link to={`/album/${entry.album.itunesId}`} style={{ color: 'inherit', fontWeight: 500 }}>
                      {entry.album.title}
                    </Link>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    <Link to={`/artist/${entry.album.artistId}`} style={{ color: 'inherit' }}>
                      {entry.album.artistName}
                    </Link>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {formatDate(entry.listenedAt) ?? 'No date'}
                    {entry.isFirstListen && (
                      <span style={{ marginLeft: 8, color: '#7c3aed' }}>First listen</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(tabData.tab === 'listened' || tabData.tab === 'nextup') && (
        <AlbumGrid
          albums={tabData.albums}
          emptyMessage={tabData.tab === 'listened' ? 'No albums listened yet.' : 'Nothing in the queue yet.'}
        />
      )}
    </main>
  )
}
