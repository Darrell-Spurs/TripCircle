import express, { Response } from 'express';
import { prisma } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalTrips = await prisma.trip.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tripsOverTime = await prisma.trip.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActive: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(sevenDaysAgo);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await prisma.event.count({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          userId: { not: null },
        },
      });

      dailyActive[dayStart.toISOString().split('T')[0]] = count;
    }

    const exploreEvents = await prisma.event.count({
      where: { eventType: 'explore_search' },
    });

    const totalShareLinks = await prisma.shareLink.count();
    const now = new Date();
    const activeShareLinks = await prisma.shareLink.count({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    });

    const tripsWithActivities = await prisma.trip.findMany({
      include: { activities: true },
      take: 10,
    });

    const mostActiveTrips = tripsWithActivities
      .map((trip) => ({
        tripId: trip.id,
        title: trip.title,
        activityCount: trip.activities.length,
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 5);

    const allEvents = await prisma.event.findMany();
    const eventTypeBreakdown: Record<string, number> = {};
    for (const event of allEvents) {
      eventTypeBreakdown[event.eventType] = (eventTypeBreakdown[event.eventType] || 0) + 1;
    }

    res.json({
      totalUsers,
      totalTrips,
      tripsOverTime: tripsOverTime.map((trip) => ({
        date: trip.createdAt.toISOString().split('T')[0],
        count: 1,
      })),
      dailyActiveUsers: dailyActive,
      exploreUsage: exploreEvents,
      shareLinkStats: {
        total: totalShareLinks,
        active: activeShareLinks,
      },
      mostActiveTrips,
      eventTypeBreakdown,
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get metrics' });
  }
});

export default router;

