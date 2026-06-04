import { Link } from 'react-router-dom'
import type { Album } from '../types/album'

export default function AlbumCard({ album }: { album: Album }) {
  return (
    <Link to={`/album/${album.itunesId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', gap: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
        {album.coverArtUrl ? (
          <img src={album.coverArtUrl} alt={album.title} width={64} height={64} style={{ objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 64, height: 64, background: '#ccc', flexShrink: 0 }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <strong>{album.title}</strong>
          <span>{album.artistName}</span>
          {album.releaseYear > 0 && (
            <span style={{ fontSize: '0.85em', color: '#666' }}>{album.releaseYear}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
