import express, { Request, Response } from 'express';
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
        shareLinks: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          orderBy: { id: 'desc' },
          take: 1,
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

    // Get share token if available (for import functionality)
    const shareToken = trip.shareLinks.length > 0 ? trip.shareLinks[0].token : null;

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
      shareToken,
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
router.post('/:id/publish', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  // allowImports parameter controls whether a share link should exist
  const allowImports = req.body.allowImports === true;

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    if (trip.ownerId !== authReq.user.id) {
      res.status(403).json({ detail: 'Only the owner can publish this trip' });
      return;
    }

    // Handle share links based on allowImports setting
    if (allowImports) {
      // Check if a share link already exists
      const existingLink = await prisma.shareLink.findFirst({
        where: { tripId },
      });
      
      // Create one if it doesn't exist
      if (!existingLink) {
        const { randomBytes } = await import('crypto');
        const token = randomBytes(32).toString('hex');
        await prisma.shareLink.create({
          data: {
            tripId,
            token,
            permission: 'view',
          },
        });
      }
    } else {
      // Delete any existing share links if imports are not allowed
      await prisma.shareLink.deleteMany({
        where: { tripId },
      });
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
router.post('/:id/unpublish', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
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

    if (trip.ownerId !== authReq.user.id) {
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

// Import a published trip to user's own account
router.post('/:id/import', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    const sourceTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        activities: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!sourceTrip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    if (!sourceTrip.isPublished) {
      res.status(403).json({ detail: 'This trip is not published and cannot be imported' });
      return;
    }

    // Create new trip for the user (don't copy body/story - user should write their own)
    const newTrip = await prisma.trip.create({
      data: {
        ownerId: authReq.user.id,
        title: `${sourceTrip.title} (Imported)`,
        description: sourceTrip.description,
        // body is intentionally not copied - user should write their own story
        coverImage: sourceTrip.coverImage,
        startDate: sourceTrip.startDate,
        endDate: sourceTrip.endDate,
        status: 'planning', // Reset status to planning
        isPublished: false, // Don't publish imported trips
      },
    });

    // Add user as owner member
    await prisma.tripMember.create({
      data: {
        tripId: newTrip.id,
        userId: authReq.user.id,
        role: 'owner',
      },
    });

    // Copy all activities (notes are copied, but body/story is not)
    if (sourceTrip.activities.length > 0) {
      await prisma.activity.createMany({
        data: sourceTrip.activities.map((a) => ({
          tripId: newTrip.id,
          date: a.date,
          startTime: a.startTime,
          endTime: a.endTime,
          title: a.title,
          notes: a.notes,
          // body is intentionally not copied - user should write their own story
          placeId: a.placeId,
          locationName: a.locationName,
          address: a.address,
          lat: a.lat,
          lng: a.lng,
          orderIndex: a.orderIndex,
        })),
      });
    }

    res.json({
      message: 'Trip imported successfully',
      tripId: newTrip.id,
      title: newTrip.title,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ detail: 'Failed to import trip' });
  }
});

export default router;

