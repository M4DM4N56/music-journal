import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import AlbumGrid from '../components/AlbumGrid'
import type { Album } from '../types/album'

type ProfileUser = { id: string; username: string | null; displayName: string; avatarUrl: string | null }

type UserStats = {
  totalListened: number
  totalLogged: number
  loggedThisYear: number
  averageRating: number | null
  totalRatings: number
  ratingDistribution: Record<number, number>
  topArtists: { artistName: string; artistId: number; count: number }[]
}

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

type RatingsMap = Record<number, number>

type TabData =
  | { tab: 'activity'; entries: DiaryEntry[]; ratingsMap: RatingsMap }
  | { tab: 'listened'; albums: Album[]; ratingsMap: RatingsMap }
  | { tab: 'nextup'; albums: Album[] }
  | { tab: 'stats' }

const VALID_TABS = ['activity', 'listened', 'nextup', 'stats'] as const
type Tab = (typeof VALID_TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  activity: 'Activity',
  listened: 'Listened',
  nextup: 'Next Up',
  stats: 'Stats',
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface ActivityGroup {
  label: string
  entries: DiaryEntry[]
}

function groupByMonth(entries: DiaryEntry[]): ActivityGroup[] {
  const map = new Map<string, DiaryEntry[]>()
  for (const e of entries) {
    const key = e.listenedAt
      ? new Date(e.listenedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '__nodate__'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  const groups: ActivityGroup[] = []
  for (const [label, items] of map.entries()) {
    if (label !== '__nodate__') groups.push({ label, entries: items })
  }
  if (map.has('__nodate__')) groups.push({ label: 'No date', entries: map.get('__nodate__')! })
  return groups
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawTab = searchParams.get('tab') ?? 'activity'
  const activeTab: Tab = (VALID_TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : 'activity'

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [tabData, setTabData] = useState<TabData | null>(null)
  const [pageStatus, setPageStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [firstListenOnly, setFirstListenOnly] = useState(false)

  useEffect(() => {
    if (!username) return
    setPageStatus('loading')

    // For the stats tab we only need user info from the profile endpoint;
    // use activity as the tab param so the server returns a valid response.
    const profileTab = activeTab === 'stats' ? 'activity' : activeTab

    Promise.all([
      api.get(`/api/users/${encodeURIComponent(username)}?tab=${profileTab}`),
      api.get(`/api/users/${encodeURIComponent(username)}/stats`),
    ])
      .then(async ([profileRes, statsRes]) => {
        if (profileRes.status === 404) { setPageStatus('notfound'); return }
        if (!profileRes.ok || !statsRes.ok) { setPageStatus('error'); return }
        const [profileData, statsData] = await Promise.all([profileRes.json(), statsRes.json()])
        setProfileUser(profileData.user)
        setUserStats(statsData)
        setTabData(activeTab === 'stats' ? { tab: 'stats' } : (profileData as TabData))
        setPageStatus('ok')
      })
      .catch(() => setPageStatus('error'))
  }, [username, activeTab])

  if (pageStatus === 'loading') return <main style={{ padding: '16px' }}><p>Loading...</p></main>
  if (pageStatus === 'notfound') return <main style={{ padding: '16px' }}><p>User not found.</p></main>
  if (pageStatus === 'error') return <main style={{ padding: '16px' }}><p>Something went wrong.</p></main>
  if (!profileUser || !userStats || !tabData) return null

  const isOwn = authUser?.id === profileUser.id
  const maxCount = Math.max(...Object.values(userStats.ratingDistribution), 1)

  return (
    <main style={{ padding: '16px 24px', maxWidth: '1400px', margin: '0 auto' }}>
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
        <span><strong>{userStats.totalListened}</strong> listened</span>
        <span><strong>{userStats.averageRating ?? '—'}</strong> avg rating</span>
        <span><strong>{userStats.loggedThisYear}</strong> this year</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        {(VALID_TABS as readonly Tab[]).map((tab) => (
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
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content — activity */}
      {tabData.tab === 'activity' && (() => {
        const visible = firstListenOnly
          ? tabData.entries.filter((e) => e.isFirstListen)
          : tabData.entries
        const groups = groupByMonth(visible)
        return (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', cursor: 'pointer' }}>
              <input
                type='checkbox'
                checked={firstListenOnly}
                onChange={(e) => setFirstListenOnly(e.target.checked)}
              />
              Show first listens only
            </label>
            {visible.length === 0 ? (
              <p style={{ color: '#6b7280' }}>
                {firstListenOnly ? 'No first listens logged yet.' : 'No activity yet.'}
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '2px solid #111', padding: '8px 0', margin: '16px 0 8px',
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{group.label}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{group.entries.length}</span>
                  </div>
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}
                    >
                      <div style={{ width: 28, textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0, color: '#111' }}>
                        {tabData.ratingsMap[entry.album.itunesId] ?? ''}
                      </div>
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
                  ))}
                </div>
              ))
            )}
          </div>
        )
      })()}

      {/* Tab content — listened */}
      {tabData.tab === 'listened' && (
        <AlbumGrid
          albums={tabData.albums}
          emptyMessage='No albums listened yet.'
          scoresMap={tabData.ratingsMap}
        />
      )}

      {/* Tab content — nextup */}
      {tabData.tab === 'nextup' && (
        <AlbumGrid albums={tabData.albums} emptyMessage='Nothing in the queue yet.' />
      )}

      {/* Tab content — stats */}
      {tabData.tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Key stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Albums listened', value: userStats.totalListened },
              { label: 'Albums logged', value: userStats.totalLogged },
              { label: 'Logged this year', value: userStats.loggedThisYear },
              { label: 'Average rating', value: userStats.averageRating ?? '—' },
              { label: 'Total ratings', value: userStats.totalRatings },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Rating distribution */}
          <div>
            <h3 style={{ margin: '0 0 12px' }}>Rating distribution</h3>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
              const count = userStats.ratingDistribution[score] ?? 0
              const pct = (count / maxCount) * 100
              return (
                <div key={score} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ width: 16, fontSize: '0.7rem', textAlign: 'right', color: '#6b7280' }}>
                    {score}
                  </span>
                  <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 2, height: 16 }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: '#111',
                        borderRadius: 2,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span style={{ width: 28, fontSize: '0.7rem', color: '#6b7280' }}>{count}</span>
                </div>
              )
            })}
          </div>

          {/* Top artists */}
          <div>
            <h3 style={{ margin: '0 0 12px' }}>Top artists</h3>
            {userStats.topArtists.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No data yet.</p>
            ) : (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userStats.topArtists.map((artist, i) => (
                  <li key={artist.artistId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: 20, color: '#9ca3af', fontSize: '0.85rem', textAlign: 'right' }}>
                      #{i + 1}
                    </span>
                    <Link
                      to={`/artist/${artist.artistId}`}
                      style={{ color: 'inherit', fontWeight: 500, flex: 1 }}
                    >
                      {artist.artistName}
                    </Link>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {artist.count} {artist.count === 1 ? 'album' : 'albums'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
