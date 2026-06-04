import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { prisma } from '../lib/prisma'

const router = Router()

const diaryEntrySchema = z.object({
  itunesId: z.number().int().positive(),
  listenedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isFirstListen: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
})

router.get('/api/diary', requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
  const skip = (page - 1) * limit

  const [entries, total] = await Promise.all([
    prisma.diaryEntry.findMany({
      where: { userId: req.user!.id },
      orderBy: [
        { listenedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
      include: {
        album: {
          select: { title: true, coverArtUrl: true, artistName: true },
        },
      },
    }),
    prisma.diaryEntry.count({ where: { userId: req.user!.id } }),
  ])

  res.json({ entries, total, page, limit })
})

router.post('/api/diary', requireAuth, validate(diaryEntrySchema), async (req: Request, res: Response) => {
  const { itunesId, listenedAt, isFirstListen, notes } = req.body as z.infer<typeof diaryEntrySchema>

  const album = await prisma.album.findUnique({ where: { itunesId } })
  if (!album) {
    res.status(404).json({ error: 'Album not found' })
    return
  }

  const [entry] = await Promise.all([
    prisma.diaryEntry.create({
      data: {
        userId: req.user!.id,
        albumId: album.id,
        listenedAt: listenedAt ? new Date(listenedAt) : null,
        isFirstListen,
        notes: notes ?? null,
      },
      include: {
        album: {
          select: { title: true, coverArtUrl: true, artistName: true },
        },
      },
    }),
    prisma.albumStatus.upsert({
      where: { userId_itunesId: { userId: req.user!.id, itunesId } },
      update: { listened: true, nextUp: false, updatedAt: new Date() },
      create: { userId: req.user!.id, itunesId, listened: true, nextUp: false },
    }),
  ])

  res.json({ entry })
})

router.delete('/api/diary/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params

  const entry = await prisma.diaryEntry.findUnique({ where: { id } })
  if (!entry) {
    res.status(404).json({ error: 'Diary entry not found' })
    return
  }
  if (entry.userId !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  await prisma.diaryEntry.delete({ where: { id } })
  res.json({ success: true })
})

export default router
