import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import RatingPicker from '../components/RatingPicker'
import LogModal from '../components/LogModal'
import type { Album } from '../types/album'

export default function AlbumPage() {
  const { itunesId: itunesIdParam } = useParams<{ itunesId: string }>()
  const itunesId = parseInt(itunesIdParam ?? '', 10)
  const [album, setAlbum] = useState<Album | null>(null)
  const [rating, setRating] = useState<{ score: number; updatedAt: string } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [showModal, setShowModal] = useState(false)
  const [loggedMessage, setLoggedMessage] = useState(false)

  useEffect(() => {
    if (isNaN(itunesId)) { setStatus('notfound'); return }
    setStatus('loading')
    Promise.all([
      api.get(`/api/albums/${itunesId}`),
      api.get(`/api/ratings/${itunesId}`),
    ])
      .then(async ([albumRes, ratingRes]) => {
        if (albumRes.status === 404) { setStatus('notfound'); return }
        if (!albumRes.ok) { setStatus('error'); return }
        const [albumData, ratingData] = await Promise.all([albumRes.json(), ratingRes.json()])
        setAlbum(albumData)
        setRating(ratingData.rating)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [itunesId])

  function handleRated(score: number) {
    setRating((prev) => ({ ...prev, score, updatedAt: new Date().toISOString() }))
  }

  function handleLogged() {
    setShowModal(false)
    setLoggedMessage(true)
    setTimeout(() => setLoggedMessage(false), 3000)
  }

  if (status === 'loading') return <main style={{ padding: '16px' }}><p>Loading...</p></main>
  if (status === 'notfound') return <main style={{ padding: '16px' }}><p>Album not found</p></main>
  if (status === 'error') return <main style={{ padding: '16px' }}><p>Something went wrong</p></main>
  if (!album) return null

  return (
    <main style={{ padding: '16px', maxWidth: '640px' }}>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        {album.coverArtUrl ? (
          <img src={album.coverArtUrl} alt={album.title} width={180} height={180} style={{ objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 180, height: 180, background: '#ccc', flexShrink: 0 }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ margin: 0 }}>{album.title}</h1>
          <Link to={`/artist/${album.artistId}`} style={{ color: 'inherit' }}>
            {album.artistName}
          </Link>
          {album.releaseYear > 0 && <span>{album.releaseYear}</span>}
        </div>
      </div>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Your rating</h2>
        {rating && (
          <p style={{ margin: '0 0 8px' }}>Current: <strong>{rating.score}/10</strong></p>
        )}
        <RatingPicker itunesId={album.itunesId} initialScore={rating?.score ?? null} onRated={handleRated} />
      </section>

      <section>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Log this album
        </button>
        {loggedMessage && (
          <span style={{ marginLeft: '12px', color: 'green' }}>Logged!</span>
        )}
      </section>

      {showModal && (
        <LogModal
          itunesId={album.itunesId}
          onClose={() => setShowModal(false)}
          onSuccess={handleLogged}
        />
      )}
    </main>
  )
}
