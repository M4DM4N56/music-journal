import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getAlbum } from '../services/itunes'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

const VALID_TABS = ['activity', 'listened', 'nextup'] as const
type Tab = (typeof VALID_TABS)[number]

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

router.get('/api/users/search', async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q) {
    res.status(400).json({ error: 'q is required' })
    return
  }

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: 'insensitive' },
      NOT: { username: null },
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
    take: 20,
  })

  res.json({ users })
})

router.get('/api/users/check-username', async (req: Request, res: Response) => {
  const username = req.query.username as string | undefined
  if (!username) {
    res.status(400).json({ error: 'username is required' })
    return
  }

  if (!USERNAME_RE.test(username)) {
    res.status(400).json({ error: 'Invalid username format' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  res.json({ available: existing === null })
})

router.patch('/api/users/me/username', requireAuth, async (req: Request, res: Response) => {
  const { username } = req.body as { username?: string }

  if (!username || !USERNAME_RE.test(username)) {
    res.status(400).json({ error: 'Invalid username format' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    res.status(409).json({ error: 'Username taken' })
    return
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { username },
    select: { username: true },
  })

  res.json({ username: updated.username })
})

router.get('/api/users/:username/stats', async (req: Request, res: Response) => {
  const { username: usernameParam } = req.params

  const user = await prisma.user.findUnique({
    where: { username: usernameParam },
    select: { id: true },
  })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const [
    totalListened,
    totalLogged,
    loggedThisYear,
    ratingAgg,
    totalRatings,
    ratingGroups,
    listenedStatuses,
  ] = await Promise.all([
    prisma.albumStatus.count({ where: { userId: user.id, listened: true } }),
    prisma.diaryEntry.count({ where: { userId: user.id } }),
    prisma.diaryEntry.count({ where: { userId: user.id, createdAt: { gte: yearStart } } }),
    prisma.rating.aggregate({ where: { userId: user.id }, _avg: { score: true } }),
    prisma.rating.count({ where: { userId: user.id } }),
    prisma.rating.groupBy({
      by: ['score'],
      where: { userId: user.id },
      _count: { score: true },
    }),
    prisma.albumStatus.findMany({
      where: { userId: user.id, listened: true },
      select: { itunesId: true },
    }),
  ])

  const avg = ratingAgg._avg.score
  const averageRating = avg !== null ? Math.round(avg * 10) / 10 : null

  const ratingDistribution = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => {
      const score = i + 1
      const group = ratingGroups.find((g) => g.score === score)
      return [score, group ? group._count.score : 0]
    }),
  ) as Record<number, number>

  const itunesIds = listenedStatuses.map((s) => s.itunesId)
  const albums = itunesIds.length
    ? await prisma.album.findMany({ where: { itunesId: { in: itunesIds } } })
    : []

  const artistMap = new Map<number, { artistName: string; artistId: number; count: number }>()
  for (const album of albums) {
    const entry = artistMap.get(album.artistId)
    if (entry) {
      entry.count++
    } else {
      artistMap.set(album.artistId, { artistName: album.artistName, artistId: album.artistId, count: 1 })
    }
  }
  const topArtists = Array.from(artistMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  res.json({
    totalListened,
    totalLogged,
    loggedThisYear,
    averageRating,
    totalRatings,
    ratingDistribution,
    topArtists,
  })
})

router.get('/api/users/:username', async (req: Request, res: Response) => {
  const { username: usernameParam } = req.params
  const tabParam = (req.query.tab as string) ?? 'activity'

  if (!VALID_TABS.includes(tabParam as Tab)) {
    res.status(400).json({ error: `Invalid tab. Must be one of: ${VALID_TABS.join(', ')}` })
    return
  }
  const tab = tabParam as Tab

  const user = await prisma.user.findUnique({
    where: { username: usernameParam },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
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

  async function buildRatingsMap(userId: string): Promise<Record<number, number>> {
    const ratings = await prisma.rating.findMany({
      where: { userId },
      select: { albumId: true, score: true },
    })
    // resolve albumId → itunesId
    const albumIds = ratings.map((r) => r.albumId)
    if (albumIds.length === 0) return {}
    const albumRows = await prisma.album.findMany({
      where: { id: { in: albumIds } },
      select: { id: true, itunesId: true },
    })
    const idToItunes = new Map(albumRows.map((a) => [a.id, a.itunesId]))
    return Object.fromEntries(
      ratings.flatMap((r) => {
        const itunesId = idToItunes.get(r.albumId)
        return itunesId !== undefined ? [[itunesId, r.score]] : []
      }),
    )
  }

  if (tab === 'activity') {
    const [entries, ratingsMap] = await Promise.all([
      prisma.diaryEntry.findMany({
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
      }),
      buildRatingsMap(user.id),
    ])
    res.json({ user, stats, tab, entries, ratingsMap })
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

  if (tab === 'listened') {
    const ratingsMap = await buildRatingsMap(user.id)
    res.json({ user, stats, tab, albums, ratingsMap })
    return
  }

  res.json({ user, stats, tab, albums })
})

export default router
