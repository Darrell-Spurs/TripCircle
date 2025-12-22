import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to validate date strings (accepts both "YYYY-MM-DD" and ISO datetime formats)
const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid datetime' }
);

const tripCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  body: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  status: z.string().default('planning'),
  isPublished: z.boolean().optional().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
});

const tripUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  body: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  status: z.string().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const ownedTrips = await prisma.trip.findMany({
    where: { ownerId: authReq.user.id },
    include: {
      members: { include: { user: true } },
      activities: true,
    },
  });

  // Get owned trip IDs for filtering
  const ownedTripIds = new Set(ownedTrips.map(trip => trip.id));

  const memberTrips = await prisma.tripMember.findMany({
    where: { 
      userId: authReq.user.id,
      // Exclude trips where user is already the owner
      tripId: { notIn: Array.from(ownedTripIds) }
    },
    include: {
      trip: {
        include: {
          members: { include: { user: true } },
          activities: true,
        },
      },
    },
  });

  // Map owned trips
  const ownedTripsMap = new Map<number, {
    id: number;
    title: string;
    description: string | null;
    body: string | null;
    coverImage: string | null;
    startDate: string;
    endDate: string;
    status: string;
    isPublished: boolean;
    publishedAt: string | null;
    ownerId: number;
    isOwner: boolean;
    role: 'owner' | 'editor' | 'viewer';
    createdAt: string;
    updatedAt: string;
  }>(
    ownedTrips.map((trip) => [
      trip.id,
      {
        id: trip.id,
        title: trip.title,
        description: trip.description,
        body: trip.body,
        coverImage: trip.coverImage,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        status: trip.status,
        isPublished: trip.isPublished,
        publishedAt: trip.publishedAt?.toISOString() || null,
        ownerId: trip.ownerId,
        isOwner: true,
        role: 'owner' as const,
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
      },
    ])
  );

  // Add member trips (already filtered to exclude owned trips)
  memberTrips.forEach((member) => {
    if (!ownedTripsMap.has(member.trip.id)) {
      ownedTripsMap.set(member.trip.id, {
        id: member.trip.id,
        title: member.trip.title,
        description: member.trip.description,
        body: member.trip.body,
        coverImage: member.trip.coverImage,
        startDate: member.trip.startDate.toISOString(),
        endDate: member.trip.endDate.toISOString(),
        status: member.trip.status,
        isPublished: member.trip.isPublished,
        publishedAt: member.trip.publishedAt?.toISOString() || null,
        ownerId: member.trip.ownerId,
        isOwner: false,
        role: (member.role === 'owner' ? 'owner' : member.role === 'editor' ? 'editor' : 'viewer') as 'owner' | 'editor' | 'viewer',
        createdAt: member.trip.createdAt.toISOString(),
        updatedAt: member.trip.updatedAt.toISOString(),
      });
    }
  });

  const trips = Array.from(ownedTripsMap.values());

  res.json({ trips });
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  try {
    const data = tripCreateSchema.parse(req.body);

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      res.status(400).json({ detail: 'End date must be after start date' });
      return;
    }

    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;

    const trip = await prisma.trip.create({
      data: {
        ownerId: authReq.user.id,
        title: data.title,
        description: data.description,
        body: data.body || null,
        coverImage: data.coverImage || null,
        startDate,
        endDate,
        status: data.status,
        isPublished: data.isPublished ?? false,
        publishedAt,
      },
    });

    // Don't create TripMember entry for owner - ownership is already established via ownerId
    // This prevents duplicates when fetching trips

    res.json({
      id: trip.id,
      title: trip.title,
      description: trip.description,
      body: trip.body,
      coverImage: trip.coverImage,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      status: trip.status,
      isPublished: trip.isPublished,
      publishedAt: trip.publishedAt?.toISOString() || null,
      ownerId: trip.ownerId,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Failed to create trip' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
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

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      owner: true,
      members: { include: { user: true } },
      activities: {
        orderBy: { orderIndex: 'asc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              email: true,
              provider: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  email: true,
                  provider: true,
                },
              },
            },
          },
          tags: true,
          costShares: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  email: true,
                  provider: true,
                },
              },
            },
          },
          preferences: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  email: true,
                  provider: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      },
    },
  });

  if (!trip) {
    res.status(404).json({ detail: 'Trip not found' });
    return;
  }

  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const userId = authReq.user.id;
  const isOwner = trip.ownerId === userId;
  const isMember = trip.members.some((m) => m.userId === userId);

  if (!isOwner && !isMember) {
    res.status(403).json({ detail: "You don't have access to this trip" });
    return;
  }

  const userMember = trip.members.find((m) => m.userId === userId);
  const role = isOwner ? 'owner' : userMember?.role || 'viewer';

  res.json({
    id: trip.id,
    title: trip.title,
    description: trip.description,
    body: trip.body,
    coverImage: trip.coverImage,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    status: trip.status,
    isPublished: trip.isPublished,
    publishedAt: trip.publishedAt?.toISOString() || null,
    ownerId: trip.ownerId,
    owner: {
      id: trip.owner.id,
      name: trip.owner.name,
      email: trip.owner.email,
      avatarUrl: trip.owner.avatarUrl,
    },
    role,
    members: trip.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      },
    })),
    activities: trip.activities.map((a) => {
      const preferenceCounts = {
        interested: a.preferences.filter((p) => p.preference === 'interested').length,
        not_interested: a.preferences.filter((p) => p.preference === 'not_interested').length,
      };

      return {
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
        createdByUserId: a.createdByUserId,
        createdBy: a.createdBy
          ? {
              id: a.createdBy.id,
              name: a.createdBy.name,
              email: a.createdBy.email,
              avatarUrl: a.createdBy.avatarUrl,
              provider: a.createdBy.provider,
            }
          : null,
        cost: a.cost,
        currency: a.currency,
        participants: a.participants.map((p) => ({
          id: p.id,
          activityId: p.activityId,
          userId: p.userId,
          user: {
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
            avatarUrl: p.user.avatarUrl,
            provider: p.user.provider,
          },
          createdAt: p.createdAt.toISOString(),
        })),
        tags: a.tags.map((t) => t.tag),
        costShares: a.costShares.map((cs) => ({
          id: cs.id,
          activityId: cs.activityId,
          userId: cs.userId,
          user: {
            id: cs.user.id,
            name: cs.user.name,
            email: cs.user.email,
            avatarUrl: cs.user.avatarUrl,
            provider: cs.user.provider,
          },
          amount: cs.amount,
          createdAt: cs.createdAt.toISOString(),
          updatedAt: cs.updatedAt.toISOString(),
        })),
        preferenceCounts,
        commentsCount: a._count.comments,
        lastModifiedAt: a.updatedAt?.toISOString() || a.createdAt?.toISOString() || new Date().toISOString(),
      };
    }),
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  });
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
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

    const isOwner = trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this trip" });
      return;
    }

    const data = tripUpdateSchema.parse(req.body);
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.body !== undefined) updateData.body = data.body || null;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }

    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : trip.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : trip.endDate;

      if (endDate <= startDate) {
        res.status(400).json({ detail: 'End date must be after start date' });
        return;
      }

      if (data.startDate) updateData.startDate = startDate;
      if (data.endDate) updateData.endDate = endDate;
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
    });

    res.json({
      id: updatedTrip.id,
      title: updatedTrip.title,
      description: updatedTrip.description,
      body: updatedTrip.body,
      coverImage: updatedTrip.coverImage,
      startDate: updatedTrip.startDate.toISOString(),
      endDate: updatedTrip.endDate.toISOString(),
      status: updatedTrip.status,
      isPublished: updatedTrip.isPublished,
      publishedAt: updatedTrip.publishedAt?.toISOString() || null,
      ownerId: updatedTrip.ownerId,
      createdAt: updatedTrip.createdAt.toISOString(),
      updatedAt: updatedTrip.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Failed to update trip' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
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

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });

  if (!trip) {
    res.status(404).json({ detail: 'Trip not found' });
    return;
  }

  if (trip.ownerId !== authReq.user.id) {
    res.status(403).json({ detail: 'Only the owner can delete this trip' });
    return;
  }

  await prisma.trip.delete({ where: { id: tripId } });

  res.json({ message: 'Trip deleted successfully' });
});

export default router;

