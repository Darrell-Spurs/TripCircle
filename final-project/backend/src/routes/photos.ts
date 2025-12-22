import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

const addPhotoSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const updatePhotoSchema = z.object({
  caption: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Helper function to check if user is owner or editor
async function checkTripEditAccess(tripId: number, userId: number): Promise<{ hasAccess: boolean; trip: any | null }> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    return { hasAccess: false, trip: null };
  }

  if (trip.ownerId === userId) {
    return { hasAccess: true, trip };
  }

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId },
  });

  if (member && (member.role === 'owner' || member.role === 'editor')) {
    return { hasAccess: true, trip };
  }

  return { hasAccess: false, trip };
}

// Helper function to check if user has any access (including viewer)
async function checkTripViewAccess(tripId: number, userId: number): Promise<{ hasAccess: boolean; trip: any | null }> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    return { hasAccess: false, trip: null };
  }

  if (trip.ownerId === userId) {
    return { hasAccess: true, trip };
  }

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId },
  });

  if (member) {
    return { hasAccess: true, trip };
  }

  return { hasAccess: false, trip };
}

// GET /trips/:tripId/photos - List all photos in album (members only)
router.get('/trips/:tripId/photos', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    const { hasAccess, trip } = await checkTripViewAccess(tripId, authReq.user.id);
    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }
    if (!hasAccess) {
      res.status(403).json({ detail: "You don't have access to this trip" });
      return;
    }

    const photos = await prisma.tripPhoto.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(
      photos.map((photo) => ({
        id: photo.id,
        tripId: photo.tripId,
        url: photo.url,
        caption: photo.caption,
        isPublic: photo.isPublic,
        isFeedCover: photo.isFeedCover,
        addedBy: photo.addedBy,
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ detail: 'Failed to fetch photos' });
  }
});

// POST /trips/:tripId/photos - Add photo (Owner/Editor only)
router.post('/trips/:tripId/photos', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    const { hasAccess, trip } = await checkTripEditAccess(tripId, authReq.user.id);
    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }
    if (!hasAccess) {
      res.status(403).json({ detail: 'Only owners and editors can add photos' });
      return;
    }

    const data = addPhotoSchema.parse(req.body);

    const photo = await prisma.tripPhoto.create({
      data: {
        tripId,
        url: data.url,
        caption: data.caption,
        isPublic: data.isPublic,
        addedByUserId: authReq.user.id,
      },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      id: photo.id,
      tripId: photo.tripId,
      url: photo.url,
      caption: photo.caption,
      isPublic: photo.isPublic,
      isFeedCover: photo.isFeedCover,
      addedBy: photo.addedBy,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    console.error('Add photo error:', error);
    res.status(500).json({ detail: 'Failed to add photo' });
  }
});

// PUT /photos/:id - Update photo (caption, isPublic)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const photoId = parseInt(req.params.id, 10);
  if (isNaN(photoId)) {
    res.status(400).json({ detail: 'Invalid photo ID' });
    return;
  }

  try {
    const photo = await prisma.tripPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      res.status(404).json({ detail: 'Photo not found' });
      return;
    }

    const { hasAccess } = await checkTripEditAccess(photo.tripId, authReq.user.id);
    if (!hasAccess) {
      res.status(403).json({ detail: 'Only owners and editors can update photos' });
      return;
    }

    const data = updatePhotoSchema.parse(req.body);

    // If setting isPublic to false, also clear isFeedCover
    const updateData: any = {};
    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.isPublic !== undefined) {
      updateData.isPublic = data.isPublic;
      if (!data.isPublic) {
        updateData.isFeedCover = false;
      }
    }

    const updatedPhoto = await prisma.tripPhoto.update({
      where: { id: photoId },
      data: updateData,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({
      id: updatedPhoto.id,
      tripId: updatedPhoto.tripId,
      url: updatedPhoto.url,
      caption: updatedPhoto.caption,
      isPublic: updatedPhoto.isPublic,
      isFeedCover: updatedPhoto.isFeedCover,
      addedBy: updatedPhoto.addedBy,
      createdAt: updatedPhoto.createdAt.toISOString(),
      updatedAt: updatedPhoto.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    console.error('Update photo error:', error);
    res.status(500).json({ detail: 'Failed to update photo' });
  }
});

// DELETE /photos/:id - Delete photo
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const photoId = parseInt(req.params.id, 10);
  if (isNaN(photoId)) {
    res.status(400).json({ detail: 'Invalid photo ID' });
    return;
  }

  try {
    const photo = await prisma.tripPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      res.status(404).json({ detail: 'Photo not found' });
      return;
    }

    const { hasAccess } = await checkTripEditAccess(photo.tripId, authReq.user.id);
    if (!hasAccess) {
      res.status(403).json({ detail: 'Only owners and editors can delete photos' });
      return;
    }

    await prisma.tripPhoto.delete({
      where: { id: photoId },
    });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ detail: 'Failed to delete photo' });
  }
});

// POST /trips/:tripId/photos/:id/set-feed-cover - Set photo as feed cover
router.post('/trips/:tripId/photos/:id/set-feed-cover', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.tripId, 10);
  const photoId = parseInt(req.params.id, 10);
  if (isNaN(tripId) || isNaN(photoId)) {
    res.status(400).json({ detail: 'Invalid trip or photo ID' });
    return;
  }

  try {
    const { hasAccess, trip } = await checkTripEditAccess(tripId, authReq.user.id);
    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }
    if (!hasAccess) {
      res.status(403).json({ detail: 'Only owners and editors can set feed cover' });
      return;
    }

    const photo = await prisma.tripPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.tripId !== tripId) {
      res.status(404).json({ detail: 'Photo not found in this trip' });
      return;
    }

    if (!photo.isPublic) {
      res.status(400).json({ detail: 'Only public photos can be set as feed cover' });
      return;
    }

    // Clear any existing feed cover for this trip
    await prisma.tripPhoto.updateMany({
      where: { tripId, isFeedCover: true },
      data: { isFeedCover: false },
    });

    // Set the new feed cover
    const updatedPhoto = await prisma.tripPhoto.update({
      where: { id: photoId },
      data: { isFeedCover: true },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({
      id: updatedPhoto.id,
      tripId: updatedPhoto.tripId,
      url: updatedPhoto.url,
      caption: updatedPhoto.caption,
      isPublic: updatedPhoto.isPublic,
      isFeedCover: updatedPhoto.isFeedCover,
      addedBy: updatedPhoto.addedBy,
      createdAt: updatedPhoto.createdAt.toISOString(),
      updatedAt: updatedPhoto.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Set feed cover error:', error);
    res.status(500).json({ detail: 'Failed to set feed cover' });
  }
});

// DELETE /trips/:tripId/feed-cover - Clear feed cover selection
router.delete('/trips/:tripId/feed-cover', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    res.status(400).json({ detail: 'Invalid trip ID' });
    return;
  }

  try {
    const { hasAccess, trip } = await checkTripEditAccess(tripId, authReq.user.id);
    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }
    if (!hasAccess) {
      res.status(403).json({ detail: 'Only owners and editors can clear feed cover' });
      return;
    }

    await prisma.tripPhoto.updateMany({
      where: { tripId, isFeedCover: true },
      data: { isFeedCover: false },
    });

    res.json({ message: 'Feed cover cleared successfully' });
  } catch (error) {
    console.error('Clear feed cover error:', error);
    res.status(500).json({ detail: 'Failed to clear feed cover' });
  }
});

export default router;

