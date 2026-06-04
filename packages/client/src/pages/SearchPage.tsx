import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import AlbumCard from '../components/AlbumCard'
import type { Album } from '../types/album'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(() => {
      api
        .get(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data: { results: Album[] }) => {
          setResults(Array.isArray(data.results) ? data.results : [])
          setHasSearched(true)
        })
        .catch(() => {
          setResults([])
          setHasSearched(true)
        })
        .finally(() => setIsLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <main style={{ padding: '16px', maxWidth: '600px' }}>
      <h1>Search</h1>
      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search albums...'
        style={{ width: '100%', padding: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
        autoFocus
      />
      <div style={{ marginTop: '16px' }}>
        {isLoading && <p>Searching...</p>}
        {!isLoading && hasSearched && results.length === 0 && <p>No results found</p>}
        {!isLoading &&
          results.map((album) => (
            <AlbumCard key={album.itunesId} album={album} />
          ))}
      </div>
    </main>
  )
}
