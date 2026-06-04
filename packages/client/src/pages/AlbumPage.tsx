import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import RatingPicker from '../components/RatingPicker'
import LogModal from '../components/LogModal'
import ListenedButton from '../components/ListenedButton'
import NextUpButton from '../components/NextUpButton'
import type { Album } from '../types/album'

interface DiaryEntry {
  id: string
  listenedAt: string | null
  notes: string | null
  createdAt: string
  album: { itunesId: number }
}

function formatEntryDate(dateStr: string | null): string {
  if (!dateStr) return 'No date'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AlbumPage() {
  const { itunesId: itunesIdParam } = useParams<{ itunesId: string }>()
  const itunesId = Number(itunesIdParam)

  const [album, setAlbum] = useState<Album | null>(null)
  const [rating, setRating] = useState<{ score: number; updatedAt: string } | null>(null)
  const [listened, setListened] = useState(false)
  const [nextUp, setNextUp] = useState(false)
  const [listenedSaving, setListenedSaving] = useState(false)
  const [nextUpSaving, setNextUpSaving] = useState(false)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [pageStatus, setPageStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [modalOpen, setModalOpen] = useState(false)

  const refetchDiary = useCallback(() => {
    api.get('/api/diary')
      .then((r) => r.json())
      .then((data: { entries: DiaryEntry[] }) => {
        setDiaryEntries((data.entries ?? []).filter((e) => e.album.itunesId === itunesId))
      })
      .catch(() => {})
  }, [itunesId])

  useEffect(() => {
    if (isNaN(itunesId)) { setPageStatus('notfound'); return }
    setPageStatus('loading')

    Promise.all([
      api.get(`/api/albums/${itunesId}`),
      api.get(`/api/ratings/${itunesId}`),
      api.get(`/api/status/${itunesId}`),
    ])
      .then(async ([albumRes, ratingRes, statusRes]) => {
        if (albumRes.status === 404) { setPageStatus('notfound'); return }
        if (!albumRes.ok) { setPageStatus('error'); return }
        const [albumData, ratingData, statusData] = await Promise.all([
          albumRes.json(),
          ratingRes.json(),
          statusRes.json(),
        ])
        setAlbum(albumData)
        setRating(ratingData.rating ?? null)
        setListened(statusData.status?.listened ?? false)
        setNextUp(statusData.status?.nextUp ?? false)
        setPageStatus('ok')
      })
      .catch(() => setPageStatus('error'))
  }, [itunesId])

  useEffect(() => {
    if (pageStatus === 'ok') refetchDiary()
  }, [pageStatus, refetchDiary])

  async function handleListenedToggle() {
    if (listenedSaving) return
    setListenedSaving(true)
    const newListened = !listened
    const res = await api.post('/api/status', { itunesId, listened: newListened })
    if (res.ok) {
      setListened(newListened)
      if (newListened) setNextUp(false)
    }
    setListenedSaving(false)
  }

  async function handleNextUpToggle() {
    if (nextUpSaving) return
    setNextUpSaving(true)
    const newNextUp = !nextUp
    const res = await api.post('/api/status', { itunesId, nextUp: newNextUp })
    if (res.ok) setNextUp(newNextUp)
    setNextUpSaving(false)
  }

  if (isNaN(itunesId)) return <main style={{ padding: '16px' }}><p>Invalid album</p></main>
  if (pageStatus === 'loading') return <main style={{ padding: '16px' }}><p>Loading...</p></main>
  if (pageStatus === 'notfound') return <main style={{ padding: '16px' }}><p>Album not found</p></main>
  if (pageStatus === 'error') return <main style={{ padding: '16px' }}><p>Something went wrong</p></main>
  if (!album) return null

  return (
    <main style={{ padding: '16px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'flex-start' }}>
        {album.coverArtUrl ? (
          <img
            src={album.coverArtUrl}
            alt={album.title}
            width={360}
            height={360}
            style={{ objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 360, height: 360, background: '#d1d5db', borderRadius: '8px', flexShrink: 0 }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ margin: 0 }}>{album.title}</h1>
          <Link to={`/artist/${album.artistId}`} style={{ color: 'inherit', fontSize: '1.1rem' }}>
            {album.artistName}
          </Link>
          {album.releaseYear > 0 && (
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{album.releaseYear}</span>
          )}
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <ListenedButton listened={listened} saving={listenedSaving} onToggle={handleListenedToggle} />
        <NextUpButton nextUp={nextUp} saving={nextUpSaving} onToggle={handleNextUpToggle} />
        <button
          onClick={() => setModalOpen(true)}
          style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
        >
          Log this album
        </button>
      </div>

      {/* Rating */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>
          Your rating{rating ? ` — ${rating.score} / 10` : ''}
        </h2>
        <RatingPicker
          itunesId={album.itunesId}
          initialScore={rating?.score ?? null}
          onRated={(score) => setRating({ score, updatedAt: new Date().toISOString() })}
        />
      </section>

      {/* Diary */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Your listens</h2>
        {diaryEntries.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No listens logged yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diaryEntries.map((entry) => (
              <li key={entry.id} style={{ fontSize: '0.875rem', borderLeft: '3px solid #e5e7eb', paddingLeft: '10px' }}>
                <div style={{ fontWeight: 500 }}>{formatEntryDate(entry.listenedAt)}</div>
                {entry.notes && <div style={{ color: '#6b7280', marginTop: '2px' }}>{entry.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {modalOpen && (
        <LogModal
          itunesId={itunesId}
          onSuccess={() => {
            setModalOpen(false)
            refetchDiary()
            setListened(true)
            setNextUp(false)
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  )
}
