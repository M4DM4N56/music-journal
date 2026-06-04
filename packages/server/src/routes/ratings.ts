import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { prisma } from '../lib/prisma'

const router = Router()

const ratingSchema = z.object({
  itunesId: z.number().int().positive(),
  score: z.number().int().min(1).max(10),
})

router.get('/api/ratings/:itunesId', requireAuth, async (req: Request, res: Response) => {
  const itunesId = parseInt(req.params.itunesId, 10)
  if (isNaN(itunesId)) {
    res.json({ rating: null })
    return
  }

  const album = await prisma.album.findUnique({ where: { itunesId } })
  if (!album) {
    res.json({ rating: null })
    return
  }

  const rating = await prisma.rating.findUnique({
    where: { userId_albumId: { userId: req.user!.id, albumId: album.id } },
    select: { score: true, updatedAt: true },
  })

  res.json({ rating: rating ?? null })
})

router.post('/api/ratings', requireAuth, validate(ratingSchema), async (req: Request, res: Response) => {
  const { itunesId, score } = req.body as z.infer<typeof ratingSchema>

  const album = await prisma.album.findUnique({ where: { itunesId } })
  if (!album) {
    res.status(404).json({ error: 'Album not found' })
    return
  }

  const [rating] = await Promise.all([
    prisma.rating.upsert({
      where: { userId_albumId: { userId: req.user!.id, albumId: album.id } },
      create: { userId: req.user!.id, albumId: album.id, score },
      update: { score, updatedAt: new Date() },
      select: { score: true, updatedAt: true },
    }),
    prisma.albumStatus.upsert({
      where: { userId_itunesId: { userId: req.user!.id, itunesId } },
      update: { listened: true, nextUp: false, updatedAt: new Date() },
      create: { userId: req.user!.id, itunesId, listened: true, nextUp: false },
    }),
  ])

  res.json({ rating })
})

export default router
