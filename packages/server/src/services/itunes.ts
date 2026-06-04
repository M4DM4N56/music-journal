import axios from 'axios'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 3600 })

export interface ItunesAlbum {
  itunesId: number
  title: string
  artistName: string
  artistId: number
  coverArtUrl: string
  releaseYear: number
}

function mapResult(r: any): ItunesAlbum {
  return {
    itunesId: r.collectionId,
    title: r.collectionName,
    artistName: r.artistName,
    artistId: r.artistId,
    coverArtUrl: (r.artworkUrl100 ?? '').replace('100x100bb', '600x600bb'),
    releaseYear: new Date(r.releaseDate).getFullYear(),
  }
}

function isAlbum(r: any): boolean {
  return r.wrapperType === 'collection' && r.collectionType === 'Album'
}

export async function searchAlbums(q: string): Promise<ItunesAlbum[]> {
  const key = `itunes:search:${q}`
  const cached = cache.get<ItunesAlbum[]>(key)
  if (cached) return cached

  try {
    const { data } = await axios.get('https://itunes.apple.com/search', {
      params: { term: q, entity: 'album', media: 'music', limit: 25 },
    })
    const results = (data.results ?? []).filter(isAlbum).map(mapResult)
    cache.set(key, results)
    return results
  } catch {
    return []
  }
}

export async function getAlbum(itunesId: number): Promise<ItunesAlbum | null> {
  const key = `itunes:album:${itunesId}`
  const cached = cache.get<ItunesAlbum>(key)
  if (cached) return cached

  try {
    const { data } = await axios.get('https://itunes.apple.com/lookup', {
      params: { id: itunesId },
    })
    const result = (data.results ?? []).find(isAlbum)
    if (!result) return null
    const album = mapResult(result)
    cache.set(key, album)
    return album
  } catch {
    return null
  }
}

export async function getArtistAlbums(
  artistId: number
): Promise<{ artistName: string; albums: ItunesAlbum[] }> {
  const key = `itunes:artist:${artistId}`
  const cached = cache.get<{ artistName: string; albums: ItunesAlbum[] }>(key)
  if (cached) return cached

  try {
    const { data } = await axios.get('https://itunes.apple.com/lookup', {
      params: { id: artistId, entity: 'album' },
    })
    const results = data.results ?? []
    const artist = results.find((r: any) => r.wrapperType === 'artist')
    const albums = results
      .filter(isAlbum)
      .map(mapResult)
      .sort((a: ItunesAlbum, b: ItunesAlbum) => b.releaseYear - a.releaseYear)
    const out = { artistName: artist?.artistName ?? 'Unknown Artist', albums }
    cache.set(key, out)
    return out
  } catch {
    return { artistName: 'Unknown Artist', albums: [] }
  }
}
