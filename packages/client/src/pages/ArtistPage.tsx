import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import AlbumGrid from '../components/AlbumGrid'
import type { Album } from '../types/album'

export default function ArtistPage() {
  const { artistId: artistIdParam } = useParams<{ artistId: string }>()
  const artistId = parseInt(artistIdParam ?? '', 10)
  const [artistName, setArtistName] = useState('')
  const [albums, setAlbums] = useState<Album[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (isNaN(artistId)) { setStatus('notfound'); return }
    setStatus('loading')
    api
      .get(`/api/artists/${artistId}`)
      .then((res) => {
        if (res.status === 404) { setStatus('notfound'); return null }
        if (!res.ok) { setStatus('error'); return null }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setArtistName(data.artist.artistName)
        setAlbums(data.albums)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [artistId])

  if (status === 'loading') return <main style={{ padding: '16px' }}><p>Loading...</p></main>
  if (status === 'notfound') return <main style={{ padding: '16px' }}><p>Artist not found</p></main>
  if (status === 'error') return <main style={{ padding: '16px' }}><p>Something went wrong</p></main>

  return (
    <main style={{ padding: '16px', maxWidth: '800px' }}>
      <h1>{artistName}</h1>
      <AlbumGrid albums={albums} />
    </main>
  )
}
