export interface Album {
  id?: string
  itunesId: number
  title: string
  artistName: string
  artistId: number
  coverArtUrl: string | null
  releaseYear: number
}
