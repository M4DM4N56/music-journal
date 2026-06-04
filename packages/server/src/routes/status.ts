import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { prisma } from '../lib/prisma'
import { getAlbum } from '../services/itunes'

const router = Router()

const statusSchema = z.object({
  itunesId: z.number().int(),
  listened: z.boolean().optional(),
  nextUp: z.boolean().optional(),
})

router.get('/api/status/:itunesId', requireAuth, async (req: Request, res: Response) => {
  const itunesId = parseInt(req.params.itunesId, 10)
  if (isNaN(itunesId)) {
    res.status(400).json({ error: 'Invalid itunesId' })
    return
  }

  const row = await prisma.albumStatus.findUnique({
    where: { userId_itunesId: { userId: req.user!.id, itunesId } },
    select: { listened: true, nextUp: true },
  })

  res.json({ status: row ?? { listened: false, nextUp: false } })
})

router.post('/api/status', requireAuth, validate(statusSchema), async (req: Request, res: Response) => {
  const { itunesId, listened, nextUp } = req.body as z.infer<typeof statusSchema>

  if (listened === undefined && nextUp === undefined) {
    res.status(400).json({ error: 'At least one of listened or nextUp must be provided' })
    return
  }

  const existing = await prisma.albumStatus.findUnique({
    where: { userId_itunesId: { userId: req.user!.id, itunesId } },
    select: { listened: true, nextUp: true },
  })

  const currentListened = existing?.listened ?? false
  const currentNextUp = existing?.nextUp ?? false

  const newListened = listened !== undefined ? listened : currentListened
  const newNextUp = listened === true ? false : (nextUp !== undefined ? nextUp : currentNextUp)

  const row = await prisma.albumStatus.upsert({
    where: { userId_itunesId: { userId: req.user!.id, itunesId } },
    create: { userId: req.user!.id, itunesId, listened: newListened, nextUp: newNextUp },
    update: { listened: newListened, nextUp: newNextUp },
    select: { listened: true, nextUp: true },
  })

  res.json({ status: row })
})

async function fetchAlbumList(userId: string, filter: { listened?: boolean; nextUp?: boolean }) {
  const rows = await prisma.albumStatus.findMany({
    where: { userId, ...filter },
    select: { itunesId: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const results = await Promise.allSettled(rows.map((r) => getAlbum(r.itunesId)))

  const albums = results
    .map((r, i) => (r.status === 'fulfilled' && r.value ? { ...r.value, statusUpdatedAt: rows[i].updatedAt } : null))
    .filter((a): a is NonNullable<typeof a> => a !== null)

  return albums
}

router.get('/api/listened', requireAuth, async (req: Request, res: Response) => {
  const albums = await fetchAlbumList(req.user!.id, { listened: true })
  res.json({ albums })
})

router.get('/api/nextup', requireAuth, async (req: Request, res: Response) => {
  const albums = await fetchAlbumList(req.user!.id, { nextUp: true })
  res.json({ albums })
})

export default router
