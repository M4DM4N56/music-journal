import { Link } from 'react-router-dom'
import type { Album } from '../types/album'

interface AlbumGridProps {
  albums: Album[]
  emptyMessage?: string
  scoresMap?: Record<number, number>
}

export default function AlbumGrid({ albums, emptyMessage = 'No albums yet.', scoresMap }: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
      {albums.map((album) => (
        <Link
          key={album.itunesId}
          to={`/album/${album.itunesId}`}
          style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
          }}
        >
          <div style={{ position: 'relative', paddingTop: '100%' }}>
            {album.coverArtUrl ? (
              <img
                src={album.coverArtUrl}
                alt={album.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: '#d1d5db' }} />
            )}
            {scoresMap?.[album.itunesId] !== undefined && (
              <div style={{
                position: 'absolute',
                bottom: 6,
                left: 6,
                background: 'rgba(0,0,0,0.72)',
                color: 'white',
                borderRadius: 4,
                padding: '2px 7px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                lineHeight: 1.4,
                pointerEvents: 'none',
              }}>
                {scoresMap[album.itunesId]}
              </div>
            )}
          </div>
          <div style={{ padding: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {album.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {album.artistName}
            </div>
            {album.releaseYear > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                {album.releaseYear}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
