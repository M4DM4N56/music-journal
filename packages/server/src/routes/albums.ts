import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { searchAlbums, getAlbum, getArtistAlbums } from '../services/itunes'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/api/search', requireAuth, async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q) {
    res.status(400).json({ error: 'Missing or empty query parameter: q' })
    return
  }

  const results = await searchAlbums(q)
  res.json({ results })
})

router.get('/api/albums/:itunesId', requireAuth, async (req: Request, res: Response) => {
  const itunesId = parseInt(req.params.itunesId, 10)
  if (isNaN(itunesId)) {
    res.status(400).json({ error: 'Invalid album ID' })
    return
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.album.findUnique({ where: { itunesId } })
  if (existing && existing.cachedAt > oneDayAgo) {
    res.json(existing)
    return
  }

  const album = await getAlbum(itunesId)
  if (!album) {
    res.status(404).json({ error: 'Album not found' })
    return
  }

  const record = await prisma.album.upsert({
    where: { itunesId: album.itunesId },
    create: {
      itunesId: album.itunesId,
      title: album.title,
      artistName: album.artistName,
      artistId: album.artistId,
      coverArtUrl: album.coverArtUrl,
      releaseYear: album.releaseYear,
    },
    update: {
      title: album.title,
      artistName: album.artistName,
      artistId: album.artistId,
      coverArtUrl: album.coverArtUrl,
      releaseYear: album.releaseYear,
      cachedAt: new Date(),
    },
  })

  res.json(record)
})

router.get('/api/artists/:artistId', requireAuth, async (req: Request, res: Response) => {
  const artistId = parseInt(req.params.artistId, 10)
  if (isNaN(artistId)) {
    res.status(400).json({ error: 'Invalid artist ID' })
    return
  }

  const { artistName, albums } = await getArtistAlbums(artistId)
  res.json({ artist: { artistId, artistName }, albums })
})

export default router
