import express, { Response } from 'express';
import { prisma } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all published trips for the feed (public)
router.get('/', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          activities: {
            orderBy: { orderIndex: 'asc' },
            take: 3, // Preview only first 3 activities
          },
          _count: {
            select: { activities: true },
          },
        },
      }),
      prisma.trip.count({ where: { isPublished: true } }),
    ]);

    const formattedTrips = trips.map((trip) => ({
      id: trip.id,
      title: trip.title,
      description: trip.description,
      body: trip.body,
      coverImage: trip.coverImage,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      status: trip.status,
      publishedAt: trip.publishedAt?.toISOString(),
      owner: trip.owner,
      activitiesCount: trip._count.activities,
      activitiesPreview: trip.activities.map((a) => ({
        id: a.id,
        title: a.title,
        locationName: a.locationName,
      })),
    }));

    res.json({
      trips: formattedTrips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ detail: 'Failed to fetch feed' });
  }
});

// Get a single published trip (public)
router.get('/:id', async (req, res: Response) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        activities: {
          orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
        },
      },
    });

    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    if (!trip.isPublished) {
      res.status(403).json({ detail: 'This trip is not published' });
      return;
    }

    res.json({
      id: trip.id,
      title: trip.title,
      description: trip.description,
      body: trip.body,
      coverImage: trip.coverImage,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      status: trip.status,
      publishedAt: trip.publishedAt?.toISOString(),
      owner: trip.owner,
      activities: trip.activities.map((a) => ({
        id: a.id,
        tripId: a.tripId,
        date: a.date.toISOString(),
        startTime: a.startTime?.toISOString() || null,
        endTime: a.endTime?.toISOString() || null,
        title: a.title,
        notes: a.notes,
        body: a.body,
        placeId: a.placeId,
        locationName: a.locationName,
        address: a.address,
        lat: a.lat,
        lng: a.lng,
        orderIndex: a.orderIndex,
      })),
    });
  } catch (error) {
    console.error('Feed trip error:', error);
    res.status(500).json({ detail: 'Failed to fetch trip' });
  }
});

// Publish a trip (owner only)
router.post('/:id/publish', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    if (trip.ownerId !== req.user.id) {
      res.status(403).json({ detail: 'Only the owner can publish this trip' });
      return;
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    res.json({
      message: 'Trip published successfully',
      isPublished: updatedTrip.isPublished,
      publishedAt: updatedTrip.publishedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ detail: 'Failed to publish trip' });
  }
});

// Unpublish a trip (owner only)
router.post('/:id/unpublish', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    if (trip.ownerId !== req.user.id) {
      res.status(403).json({ detail: 'Only the owner can unpublish this trip' });
      return;
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        isPublished: false,
      },
    });

    res.json({
      message: 'Trip unpublished successfully',
      isPublished: updatedTrip.isPublished,
    });
  } catch (error) {
    console.error('Unpublish error:', error);
    res.status(500).json({ detail: 'Failed to unpublish trip' });
  }
});

export default router;

