import express, { Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../database';
import { authenticate, authenticateOptional, AuthRequest } from '../middleware/auth';

const router = express.Router();

const createShareLinkSchema = z.object({
  permission: z.enum(['view', 'edit']).default('view'),
  expiresAt: z.string().datetime().optional(),
});

function generateShareToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

router.post('/trips/:tripId/share-links', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const tripId = parseInt(req.params.tripId, 10);
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

    const isOwner = trip.ownerId === req.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: req.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to create share links" });
      return;
    }

    const data = createShareLinkSchema.parse(req.body);
    const token = generateShareToken();

    const shareLink = await prisma.shareLink.create({
      data: {
        tripId,
        token,
        permission: data.permission,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    res.json({
      id: shareLink.id,
      token: shareLink.token,
      permission: shareLink.permission,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      url: `/share/${shareLink.token}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Failed to create share link' });
  }
});

router.get('/:token', authenticateOptional, async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      trip: {
        include: {
          owner: true,
          activities: { orderBy: { orderIndex: 'asc' } },
        },
      },
    },
  });

  if (!shareLink) {
    res.status(404).json({ detail: 'Share link not found' });
    return;
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    res.status(410).json({ detail: 'Share link has expired' });
    return;
  }

  const trip = shareLink.trip;

  const tripData = {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    coverImage: trip.coverImage,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    status: trip.status,
    activities: trip.activities.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      startTime: a.startTime?.toISOString() || null,
      endTime: a.endTime?.toISOString() || null,
      title: a.title,
      notes: a.notes,
      locationName: a.locationName,
      address: a.address,
      orderIndex: a.orderIndex,
    })),
  };

  res.json({
    trip: tripData,
    permission: shareLink.permission,
    isShared: true,
  });
});

export default router;

