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
          photos: {
            where: { isPublic: true },
            orderBy: [{ isFeedCover: 'desc' }, { createdAt: 'desc' }],
          },
          _count: {
            select: { activities: true, tripComments: true },
          },
        },
      }),
      prisma.trip.count({ where: { isPublished: true } }),
    ]);

    const formattedTrips = trips.map((trip) => {
      // Feed cover logic: feedCover > random public photo > trip cover > null
      const feedCoverPhoto = trip.photos.find((p) => p.isFeedCover);
      const randomPublicPhoto = trip.photos.length > 0 ? trip.photos[0] : null;
      const feedCoverImage = feedCoverPhoto?.url || randomPublicPhoto?.url || trip.coverImage || null;

      return {
        id: trip.id,
        title: trip.title,
        description: trip.description,
        body: trip.body,
        coverImage: trip.coverImage,
        feedCoverImage,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        status: trip.status,
        publishedAt: trip.publishedAt?.toISOString(),
        owner: trip.owner,
        activitiesCount: trip._count.activities,
        commentsCount: trip._count.tripComments,
        publicPhotosCount: trip.photos.length,
        activitiesPreview: trip.activities.map((a) => ({
          id: a.id,
          title: a.title,
          locationName: a.locationName,
        })),
      };
    });

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
        photos: {
          where: { isPublic: true },
          orderBy: [{ isFeedCover: 'desc' }, { createdAt: 'desc' }],
          include: {
            addedBy: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
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

    // Feed cover logic
    const feedCoverPhoto = trip.photos.find((p) => p.isFeedCover);
    const randomPublicPhoto = trip.photos.length > 0 ? trip.photos[0] : null;
    const feedCoverImage = feedCoverPhoto?.url || randomPublicPhoto?.url || trip.coverImage || null;

    res.json({
      id: trip.id,
      title: trip.title,
      description: trip.description,
      body: trip.body,
      coverImage: trip.coverImage,
      feedCoverImage,
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
      publicPhotos: trip.photos.map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        isFeedCover: p.isFeedCover,
        addedBy: p.addedBy,
        createdAt: p.createdAt.toISOString(),
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
    // Note: Don't create TripMember entry for owner - ownership is already established via ownerId
    // This matches the behavior in trips.ts to prevent duplicate trip entries in the dashboard
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

    // Copy all activities with importer as the creator
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
          createdByUserId: authReq.user!.id, // Set importer as the creator (添加者)
        })),
      });

      // Add importer as participant for all imported activities
      const createdActivities = await prisma.activity.findMany({
        where: { tripId: newTrip.id },
        select: { id: true },
      });

      if (createdActivities.length > 0) {
        await prisma.activityParticipant.createMany({
          data: createdActivities.map((activity) => ({
            activityId: activity.id,
            userId: authReq.user!.id,
          })),
        });
      }
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

// ============================================
// Trip Comments Endpoints
// ============================================

// Get comments for a published trip (public)
router.get('/:id/comments', async (req, res: Response) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    // Check if trip exists and is published
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, isPublished: true },
    });

    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    if (!trip.isPublished) {
      res.status(403).json({ detail: 'This trip is not published' });
      return;
    }

    const comments = await prisma.tripComment.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(
      comments.map((comment) => ({
        id: comment.id,
        tripId: comment.tripId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user,
      }))
    );
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ detail: 'Failed to fetch comments' });
  }
});

// Add a comment to a published trip (authenticated)
router.post('/:id/comments', authenticate, async (req: Request, res: Response) => {
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

  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ detail: 'Comment content is required' });
    return;
  }

  try {
    // Check if trip exists and is published
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, isPublished: true },
    });

    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    if (!trip.isPublished) {
      res.status(403).json({ detail: 'Cannot comment on unpublished trips' });
      return;
    }

    const comment = await prisma.tripComment.create({
      data: {
        tripId,
        userId: authReq.user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      id: comment.id,
      tripId: comment.tripId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: comment.user,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ detail: 'Failed to add comment' });
  }
});

// Edit own comment (authenticated)
router.put('/comments/:commentId', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const commentId = parseInt(req.params.commentId, 10);
  if (isNaN(commentId)) {
    res.status(400).json({ detail: 'Invalid comment ID' });
    return;
  }

  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ detail: 'Comment content is required' });
    return;
  }

  try {
    const comment = await prisma.tripComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ detail: 'Comment not found' });
      return;
    }

    if (comment.userId !== authReq.user.id) {
      res.status(403).json({ detail: 'You can only edit your own comments' });
      return;
    }

    const updatedComment = await prisma.tripComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({
      id: updatedComment.id,
      tripId: updatedComment.tripId,
      userId: updatedComment.userId,
      content: updatedComment.content,
      createdAt: updatedComment.createdAt.toISOString(),
      updatedAt: updatedComment.updatedAt.toISOString(),
      user: updatedComment.user,
    });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ detail: 'Failed to edit comment' });
  }
});

// Delete own comment (authenticated)
router.delete('/comments/:commentId', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const commentId = parseInt(req.params.commentId, 10);
  if (isNaN(commentId)) {
    res.status(400).json({ detail: 'Invalid comment ID' });
    return;
  }

  try {
    const comment = await prisma.tripComment.findUnique({
      where: { id: commentId },
      include: {
        trip: {
          select: { ownerId: true },
        },
      },
    });

    if (!comment) {
      res.status(404).json({ detail: 'Comment not found' });
      return;
    }

    // Allow deletion by comment author or trip owner
    if (comment.userId !== authReq.user.id && comment.trip.ownerId !== authReq.user.id) {
      res.status(403).json({ detail: 'You can only delete your own comments or comments on your trips' });
      return;
    }

    await prisma.tripComment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ detail: 'Failed to delete comment' });
  }
});

export default router;

