import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

const albumSelect = {
  select: {
    itunesId: true,
    title: true,
    coverArtUrl: true,
    artistName: true,
  },
}

router.get('/api/users/:username', async (req: Request, res: Response) => {
  const { username } = req.params

  const user = await prisma.user.findFirst({
    where: { displayName: username },
    select: { id: true, displayName: true, avatarUrl: true },
  })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const [totalRatings, ratingAggregate, totalDiaryEntries, recentRatings, recentDiaryEntries] =
    await Promise.all([
      prisma.rating.count({ where: { userId: user.id } }),
      prisma.rating.aggregate({
        where: { userId: user.id },
        _avg: { score: true },
      }),
      prisma.diaryEntry.count({ where: { userId: user.id } }),
      prisma.rating.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          score: true,
          updatedAt: true,
          album: albumSelect,
        },
      }),
      prisma.diaryEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          listenedAt: true,
          isFirstListen: true,
          notes: true,
          createdAt: true,
          album: albumSelect,
        },
      }),
    ])

  const avg = ratingAggregate._avg.score
  const averageRating = avg !== null ? Math.round(avg * 10) / 10 : null

  res.json({
    user,
    stats: { totalRatings, averageRating, totalDiaryEntries },
    recentRatings,
    recentDiaryEntries,
  })
})

export default router
