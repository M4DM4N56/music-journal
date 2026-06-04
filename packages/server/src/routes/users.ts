import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getAlbum } from '../services/itunes'

const router = Router()

const VALID_TABS = ['activity', 'listened', 'nextup'] as const
type Tab = (typeof VALID_TABS)[number]

router.get('/api/users/:username', async (req: Request, res: Response) => {
  const { username } = req.params
  const tabParam = (req.query.tab as string) ?? 'activity'

  if (!VALID_TABS.includes(tabParam as Tab)) {
    res.status(400).json({ error: `Invalid tab. Must be one of: ${VALID_TABS.join(', ')}` })
    return
  }
  const tab = tabParam as Tab

  const user = await prisma.user.findFirst({
    where: { displayName: username },
    select: { id: true, displayName: true, avatarUrl: true },
  })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const [totalListened, totalDiaryEntries, ratingAgg] = await Promise.all([
    prisma.albumStatus.count({ where: { userId: user.id, listened: true } }),
    prisma.diaryEntry.count({ where: { userId: user.id } }),
    prisma.rating.aggregate({ where: { userId: user.id }, _avg: { score: true } }),
  ])

  const avg = ratingAgg._avg.score
  const stats = {
    totalListened,
    totalDiaryEntries,
    averageRating: avg !== null ? Math.round(avg * 10) / 10 : null,
  }

  if (tab === 'activity') {
    const entries = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: [
        { listenedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        listenedAt: true,
        isFirstListen: true,
        notes: true,
        createdAt: true,
        album: {
          select: { itunesId: true, title: true, artistName: true, artistId: true, coverArtUrl: true },
        },
      },
    })
    res.json({ user, stats, tab, entries })
    return
  }

  const statusFilter = tab === 'listened' ? { listened: true } : { nextUp: true }
  const rows = await prisma.albumStatus.findMany({
    where: { userId: user.id, ...statusFilter },
    select: { itunesId: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const results = await Promise.allSettled(rows.map((r) => getAlbum(r.itunesId)))
  const albums = results
    .map((r, i) =>
      r.status === 'fulfilled' && r.value ? { ...r.value, statusUpdatedAt: rows[i].updatedAt } : null,
    )
    .filter((a): a is NonNullable<typeof a> => a !== null)

  res.json({ user, stats, tab, albums })
})

export default router
