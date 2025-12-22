import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateTagName } from '../constants/tags';

const router = express.Router();

// Helper to validate date strings (accepts both "YYYY-MM-DD" and ISO datetime formats)
const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid datetime' }
);

const activityCreateSchema = z.object({
  tripId: z.number(),
  date: dateStringSchema,
  startTime: dateStringSchema.optional(),
  endTime: dateStringSchema.optional(),
  title: z.string().min(1),
  notes: z.string().optional(),
  body: z.string().optional(),
  placeId: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  orderIndex: z.number(),
  participantIds: z.array(z.number()).optional(),
  cost: z.number().optional(),
  currency: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const activityUpdateSchema = z.object({
  date: dateStringSchema.optional(),
  startTime: dateStringSchema.optional(),
  endTime: dateStringSchema.optional(),
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  body: z.string().optional(),
  placeId: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  orderIndex: z.number().optional(),
  participantIds: z.array(z.number()).optional(),
  cost: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  lastModifiedAt: dateStringSchema.optional(),
  costShares: z.array(z.object({ userId: z.number(), amount: z.number() })).optional(),
});

router.post('/trips/:tripId/activities', authenticate, async (req: Request, res: Response) => {
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
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      res.status(404).json({ detail: 'Trip not found' });
      return;
    }

    const isOwner = trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to add activities to this trip" });
      return;
    }

    const data = activityCreateSchema.parse({ ...req.body, tripId });
    const date = new Date(data.date);

    let orderIndex = data.orderIndex;
    if (orderIndex < 0) {
      const existing = await prisma.activity.findMany({
        where: { tripId, date },
        orderBy: { orderIndex: 'desc' },
        take: 1,
      });
      orderIndex = existing[0]?.orderIndex !== undefined ? existing[0].orderIndex + 1 : 0;
    }

    // Determine participants - default to all trip members if not specified
    let participantIds = data.participantIds;
    if (!participantIds || participantIds.length === 0) {
      const allMembers = await prisma.tripMember.findMany({
        where: { tripId },
        select: { userId: true },
      });
      participantIds = allMembers.map((m) => m.userId);
    }

    // Validate tags
    if (data.tags) {
      for (const tag of data.tags) {
        const validation = validateTagName(tag);
        if (!validation.valid) {
          res.status(400).json({ detail: validation.error });
          return;
        }
      }
    }

    const activity = await prisma.activity.create({
      data: {
        tripId,
        date,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        title: data.title,
        notes: data.notes || null,
        body: data.body || null,
        placeId: data.placeId || null,
        locationName: data.locationName || null,
        address: data.address || null,
        lat: data.lat || null,
        lng: data.lng || null,
        orderIndex,
        createdByUserId: authReq.user.id,
        cost: data.cost || null,
        currency: data.currency || null,
        participants: {
          create: participantIds.map((userId) => ({ userId })),
        },
        tags: data.tags
          ? {
              create: data.tags.map((tag) => ({ tag })),
            }
          : undefined,
        history: {
          create: {
            userId: authReq.user.id,
            action: 'created',
            changes: { title: data.title },
          },
        },
      },
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
      },
    });

    // If cost is set and participants exist, create equal cost shares
    if (data.cost && participantIds.length > 0) {
      const costPerPerson = data.cost / participantIds.length;
      await prisma.activityCostShare.createMany({
        data: participantIds.map((userId) => ({
          activityId: activity.id,
          userId,
          amount: costPerPerson,
        })),
      });
    }

    const activityWithCostShares = await prisma.activity.findUnique({
      where: { id: activity.id },
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
      },
    });

    res.json({
      id: activityWithCostShares!.id,
      tripId: activityWithCostShares!.tripId,
      date: activityWithCostShares!.date.toISOString(),
      startTime: activityWithCostShares!.startTime?.toISOString() || null,
      endTime: activityWithCostShares!.endTime?.toISOString() || null,
      title: activityWithCostShares!.title,
      notes: activityWithCostShares!.notes,
      body: activityWithCostShares!.body,
      placeId: activityWithCostShares!.placeId,
      locationName: activityWithCostShares!.locationName,
      address: activityWithCostShares!.address,
      lat: activityWithCostShares!.lat,
      lng: activityWithCostShares!.lng,
      orderIndex: activityWithCostShares!.orderIndex,
      createdByUserId: activityWithCostShares!.createdByUserId,
      createdBy: activityWithCostShares!.createdBy,
      cost: activityWithCostShares!.cost,
      currency: activityWithCostShares!.currency,
      participants: activityWithCostShares!.participants.map((p) => ({
        id: p.id,
        activityId: p.activityId,
        userId: p.userId,
        user: p.user,
        createdAt: p.createdAt.toISOString(),
      })),
      tags: activityWithCostShares!.tags.map((t) => t.tag),
      costShares: activityWithCostShares!.costShares.map((cs) => ({
        id: cs.id,
        activityId: cs.activityId,
        userId: cs.userId,
        user: cs.user,
        amount: cs.amount,
        createdAt: cs.createdAt.toISOString(),
        updatedAt: cs.updatedAt.toISOString(),
      })),
      lastModifiedAt: activityWithCostShares!.updatedAt?.toISOString() || activityWithCostShares!.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    res.status(500).json({ detail: 'Failed to create activity', error: error instanceof Error ? error.message : String(error) });
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this activity" });
      return;
    }

    const data = activityUpdateSchema.parse(req.body);

    // Conflict resolution: last-write-wins
    if (data.lastModifiedAt) {
      const clientTime = new Date(data.lastModifiedAt);
      const serverTime = activity.updatedAt || activity.createdAt || new Date();

      if (serverTime > clientTime) {
        // Conflict detected - return current version
        const currentActivity = await prisma.activity.findUnique({
          where: { id: activityId },
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
          },
        });

        return res.status(409).json({
          detail: 'Activity was modified by another user',
          currentVersion: {
            id: currentActivity!.id,
            tripId: currentActivity!.tripId,
            date: currentActivity!.date.toISOString(),
            startTime: currentActivity!.startTime?.toISOString() || null,
            endTime: currentActivity!.endTime?.toISOString() || null,
            title: currentActivity!.title,
            notes: currentActivity!.notes,
            body: currentActivity!.body,
            placeId: currentActivity!.placeId,
            locationName: currentActivity!.locationName,
            address: currentActivity!.address,
            lat: currentActivity!.lat,
            lng: currentActivity!.lng,
            orderIndex: currentActivity!.orderIndex,
            createdByUserId: currentActivity!.createdByUserId,
            createdBy: currentActivity!.createdBy,
            cost: currentActivity!.cost,
            currency: currentActivity!.currency,
            participants: currentActivity!.participants.map((p) => ({
              id: p.id,
              activityId: p.activityId,
              userId: p.userId,
              user: p.user,
              createdAt: p.createdAt.toISOString(),
            })),
            tags: currentActivity!.tags.map((t) => t.tag),
            costShares: currentActivity!.costShares.map((cs) => ({
              id: cs.id,
              activityId: cs.activityId,
              userId: cs.userId,
              user: cs.user,
              amount: cs.amount,
              createdAt: cs.createdAt.toISOString(),
              updatedAt: cs.updatedAt.toISOString(),
            })),
            lastModifiedAt: currentActivity!.updatedAt?.toISOString() || currentActivity!.createdAt?.toISOString() || new Date().toISOString(),
          },
        });
      }
    }

    const updateData: any = {};
    const changes: any = {};

    if (data.date !== undefined) {
      updateData.date = new Date(data.date);
      changes.date = data.date;
    }
    if (data.startTime !== undefined) {
      updateData.startTime = data.startTime ? new Date(data.startTime) : null;
      changes.startTime = data.startTime;
    }
    if (data.endTime !== undefined) {
      updateData.endTime = data.endTime ? new Date(data.endTime) : null;
      changes.endTime = data.endTime;
    }
    if (data.title !== undefined) {
      updateData.title = data.title;
      changes.title = data.title;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
      changes.notes = data.notes;
    }
    if (data.body !== undefined) {
      updateData.body = data.body || null;
      changes.body = data.body;
    }
    if (data.placeId !== undefined) {
      updateData.placeId = data.placeId || null;
      changes.placeId = data.placeId;
    }
    if (data.locationName !== undefined) {
      updateData.locationName = data.locationName || null;
      changes.locationName = data.locationName;
    }
    if (data.address !== undefined) {
      updateData.address = data.address || null;
      changes.address = data.address;
    }
    if (data.lat !== undefined) {
      updateData.lat = data.lat || null;
      changes.lat = data.lat;
    }
    if (data.lng !== undefined) {
      updateData.lng = data.lng || null;
      changes.lng = data.lng;
    }
    if (data.orderIndex !== undefined) {
      updateData.orderIndex = data.orderIndex;
      changes.orderIndex = data.orderIndex;
    }
    if (data.cost !== undefined) {
      updateData.cost = data.cost;
      changes.cost = data.cost;
    }
    if (data.currency !== undefined) {
      updateData.currency = data.currency;
      changes.currency = data.currency;
    }

    // Handle participants update
    if (data.participantIds !== undefined) {
      // Delete existing participants
      await prisma.activityParticipant.deleteMany({
        where: { activityId },
      });
      // Create new participants
      if (data.participantIds.length > 0) {
        await prisma.activityParticipant.createMany({
          data: data.participantIds.map((userId) => ({
            activityId,
            userId,
          })),
        });
      }
      changes.participantIds = data.participantIds;
    }

    // Handle tags update
    if (data.tags !== undefined) {
      // Validate tags
      for (const tag of data.tags) {
        const validation = validateTagName(tag);
        if (!validation.valid) {
          res.status(400).json({ detail: validation.error });
          return;
        }
      }
      // Delete existing tags
      await prisma.activityTag.deleteMany({
        where: { activityId },
      });
      // Create new tags
      if (data.tags.length > 0) {
        await prisma.activityTag.createMany({
          data: data.tags.map((tag) => ({
            activityId,
            tag,
          })),
        });
      }
      changes.tags = data.tags;
    }

    // Handle cost shares update
    if (data.costShares !== undefined) {
      // Custom cost shares provided - use them directly
      await prisma.activityCostShare.deleteMany({
        where: { activityId },
      });
      if (data.costShares.length > 0) {
        await prisma.activityCostShare.createMany({
          data: data.costShares.map((share: { userId: number; amount: number }) => ({
            activityId,
            userId: share.userId,
            amount: share.amount,
          })),
        });
      }
      changes.costShares = data.costShares;
    } else if (data.cost !== undefined || data.participantIds !== undefined) {
      // No custom shares provided - auto-calculate equal split if cost is set
      await prisma.activityCostShare.deleteMany({
        where: { activityId },
      });

      // Get final cost and participants after update
      const finalCost = data.cost !== undefined ? data.cost : activity.cost;
      const finalParticipantIds =
        data.participantIds !== undefined
          ? data.participantIds
          : (await prisma.activityParticipant.findMany({ where: { activityId }, select: { userId: true } })).map(
              (p) => p.userId
            );

      // Create cost shares if cost is set and participants exist
      if (finalCost && finalParticipantIds.length > 0) {
        const costPerPerson = finalCost / finalParticipantIds.length;
        await prisma.activityCostShare.createMany({
          data: finalParticipantIds.map((userId: number) => ({
            activityId,
            userId,
            amount: Math.round(costPerPerson * 100) / 100, // Round to 2 decimals
          })),
        });
      }
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: updateData,
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
      },
    });

    // Create history entry
    await prisma.activityHistory.create({
      data: {
        activityId,
        userId: authReq.user.id,
        action: 'updated',
        changes: changes,
      },
    });

    res.json({
      id: updatedActivity.id,
      tripId: updatedActivity.tripId,
      date: updatedActivity.date.toISOString(),
      startTime: updatedActivity.startTime?.toISOString() || null,
      endTime: updatedActivity.endTime?.toISOString() || null,
      title: updatedActivity.title,
      notes: updatedActivity.notes,
      body: updatedActivity.body,
      placeId: updatedActivity.placeId,
      locationName: updatedActivity.locationName,
      address: updatedActivity.address,
      lat: updatedActivity.lat,
      lng: updatedActivity.lng,
      orderIndex: updatedActivity.orderIndex,
      createdByUserId: updatedActivity.createdByUserId,
      createdBy: updatedActivity.createdBy,
      cost: updatedActivity.cost,
      currency: updatedActivity.currency,
      participants: updatedActivity.participants.map((p) => ({
        id: p.id,
        activityId: p.activityId,
        userId: p.userId,
        user: p.user,
        createdAt: p.createdAt.toISOString(),
      })),
      tags: updatedActivity.tags.map((t) => t.tag),
      costShares: updatedActivity.costShares.map((cs) => ({
        id: cs.id,
        activityId: cs.activityId,
        userId: cs.userId,
        user: cs.user,
        amount: cs.amount,
        createdAt: cs.createdAt.toISOString(),
        updatedAt: cs.updatedAt.toISOString(),
      })),
      lastModifiedAt: updatedActivity.updatedAt?.toISOString() || updatedActivity.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Failed to update activity' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { trip: true },
  });

  if (!activity) {
    res.status(404).json({ detail: 'Activity not found' });
    return;
  }

  const isOwner = activity.trip.ownerId === authReq.user.id;
  const member = await prisma.tripMember.findFirst({
    where: { tripId: activity.tripId, userId: authReq.user.id },
  });
  const isEditor = member?.role === 'owner' || member?.role === 'editor';

  if (!isOwner && !isEditor) {
    res.status(403).json({ detail: "You don't have permission to delete this activity" });
    return;
  }

  await prisma.activity.delete({ where: { id: activityId } });

  res.json({ message: 'Activity deleted successfully' });
});

// Participants endpoints
router.get('/:id/participants', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to view this activity" });
      return;
    }

    const participants = await prisma.activityParticipant.findMany({
      where: { activityId },
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
    });

    res.json(
      participants.map((p) => ({
        id: p.id,
        activityId: p.activityId,
        userId: p.userId,
        user: p.user,
        createdAt: p.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get participants' });
  }
});

router.post('/:id/participants', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds)) {
      res.status(400).json({ detail: 'userIds must be an array' });
      return;
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this activity" });
      return;
    }

    // Verify all userIds are trip members
    const tripMembers = await prisma.tripMember.findMany({
      where: { tripId: activity.tripId, userId: { in: userIds } },
    });

    if (tripMembers.length !== userIds.length) {
      res.status(400).json({ detail: 'Some users are not trip members' });
      return;
    }

    // Delete existing and create new
    await prisma.activityParticipant.deleteMany({ where: { activityId } });
    if (userIds.length > 0) {
      await prisma.activityParticipant.createMany({
        data: userIds.map((userId: number) => ({ activityId, userId })),
      });
    }

    const participants = await prisma.activityParticipant.findMany({
      where: { activityId },
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
    });

    res.json(
      participants.map((p) => ({
        id: p.id,
        activityId: p.activityId,
        userId: p.userId,
        user: p.user,
        createdAt: p.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update participants' });
  }
});

router.delete('/:id/participants/:userId', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(activityId) || isNaN(userId)) {
    res.status(400).json({ detail: 'Invalid activity or user ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this activity" });
      return;
    }

    await prisma.activityParticipant.deleteMany({
      where: { activityId, userId },
    });

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to remove participant' });
  }
});

// Comments endpoints
router.get('/:id/comments', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to view this activity" });
      return;
    }

    const comments = await prisma.activityComment.findMany({
      where: { activityId },
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
      orderBy: { createdAt: 'asc' },
    });

    res.json(
      comments.map((c) => ({
        id: c.id,
        activityId: c.activityId,
        userId: c.userId,
        user: c.user,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get comments' });
  }
});

router.post('/:id/comments', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ detail: 'Comment content is required' });
      return;
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to comment on this activity" });
      return;
    }

    const comment = await prisma.activityComment.create({
      data: {
        activityId,
        userId: authReq.user.id,
        content: content.trim(),
      },
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
    });

    res.json({
      id: comment.id,
      activityId: comment.activityId,
      userId: comment.userId,
      user: comment.user,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to create comment' });
  }
});

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

  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ detail: 'Comment content is required' });
      return;
    }

    const comment = await prisma.activityComment.findUnique({
      where: { id: commentId },
      include: { activity: { include: { trip: true } } },
    });

    if (!comment) {
      res.status(404).json({ detail: 'Comment not found' });
      return;
    }

    if (comment.userId !== authReq.user.id) {
      res.status(403).json({ detail: "You can only edit your own comments" });
      return;
    }

    const updated = await prisma.activityComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
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
    });

    res.json({
      id: updated.id,
      activityId: updated.activityId,
      userId: updated.userId,
      user: updated.user,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update comment' });
  }
});

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
    const comment = await prisma.activityComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ detail: 'Comment not found' });
      return;
    }

    if (comment.userId !== authReq.user.id) {
      res.status(403).json({ detail: "You can only delete your own comments" });
      return;
    }

    await prisma.activityComment.delete({ where: { id: commentId } });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete comment' });
  }
});

// Cost shares endpoints
router.get('/:id/cost-shares', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to view this activity" });
      return;
    }

    const costShares = await prisma.activityCostShare.findMany({
      where: { activityId },
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
    });

    res.json(
      costShares.map((cs) => ({
        id: cs.id,
        activityId: cs.activityId,
        userId: cs.userId,
        user: cs.user,
        amount: cs.amount,
        createdAt: cs.createdAt.toISOString(),
        updatedAt: cs.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get cost shares' });
  }
});

router.post('/:id/cost-shares', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const { shares } = req.body; // Array of {userId, amount}
    if (!Array.isArray(shares)) {
      res.status(400).json({ detail: 'shares must be an array' });
      return;
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this activity" });
      return;
    }

    // Delete existing cost shares
    await prisma.activityCostShare.deleteMany({ where: { activityId } });

    // Create new cost shares
    if (shares.length > 0) {
      await prisma.activityCostShare.createMany({
        data: shares.map((s: { userId: number; amount: number }) => ({
          activityId,
          userId: s.userId,
          amount: s.amount,
        })),
      });
    }

    const costShares = await prisma.activityCostShare.findMany({
      where: { activityId },
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
    });

    res.json(
      costShares.map((cs) => ({
        id: cs.id,
        activityId: cs.activityId,
        userId: cs.userId,
        user: cs.user,
        amount: cs.amount,
        createdAt: cs.createdAt.toISOString(),
        updatedAt: cs.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({ detail: 'Failed to set cost shares' });
  }
});

router.delete('/:id/cost-shares', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this activity" });
      return;
    }

    await prisma.activityCostShare.deleteMany({ where: { activityId } });

    res.json({ message: 'Cost shares cleared successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to clear cost shares' });
  }
});

// Preferences endpoints
router.get('/:id/preferences', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to view this activity" });
      return;
    }

    const preferences = await prisma.activityPreference.findMany({
      where: { activityId },
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
    });

    const counts = {
      interested: preferences.filter((p) => p.preference === 'interested').length,
      not_interested: preferences.filter((p) => p.preference === 'not_interested').length,
    };

    res.json({
      preferences: preferences.map((p) => ({
        id: p.id,
        activityId: p.activityId,
        userId: p.userId,
        user: p.user,
        preference: p.preference,
        createdAt: p.createdAt.toISOString(),
      })),
      counts,
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get preferences' });
  }
});

router.post('/:id/preferences', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const { preference } = req.body;
    if (preference !== 'interested' && preference !== 'not_interested') {
      res.status(400).json({ detail: 'Preference must be "interested" or "not_interested"' });
      return;
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to set preference for this activity" });
      return;
    }

    const pref = await prisma.activityPreference.upsert({
      where: {
        activityId_userId: {
          activityId,
          userId: authReq.user.id,
        },
      },
      update: { preference },
      create: {
        activityId,
        userId: authReq.user.id,
        preference,
      },
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
    });

    res.json({
      id: pref.id,
      activityId: pref.activityId,
      userId: pref.userId,
      user: pref.user,
      preference: pref.preference,
      createdAt: pref.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to set preference' });
  }
});

router.delete('/:id/preferences', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    await prisma.activityPreference.deleteMany({
      where: { activityId, userId: authReq.user.id },
    });

    res.json({ message: 'Preference removed successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to remove preference' });
  }
});

// Tags endpoints
router.get('/:id/tags', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to view this activity" });
      return;
    }

    const tags = await prisma.activityTag.findMany({
      where: { activityId },
    });

    res.json(tags.map((t) => t.tag));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get tags' });
  }
});

router.post('/:id/tags', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      res.status(400).json({ detail: 'tags must be an array' });
      return;
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this activity" });
      return;
    }

    // Validate tags
    for (const tag of tags) {
      const validation = validateTagName(tag);
      if (!validation.valid) {
        res.status(400).json({ detail: validation.error });
        return;
      }
    }

    // Create tags (ignore duplicates due to unique constraint)
    await prisma.activityTag.createMany({
      data: tags.map((tag: string) => ({ activityId, tag })),
      skipDuplicates: true,
    });

    const activityTags = await prisma.activityTag.findMany({
      where: { activityId },
    });

    res.json(activityTags.map((t) => t.tag));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to add tags' });
  }
});

router.delete('/:id/tags/:tag', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  const tag = decodeURIComponent(req.params.tag);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const isEditor = member?.role === 'owner' || member?.role === 'editor';

    if (!isOwner && !isEditor) {
      res.status(403).json({ detail: "You don't have permission to edit this activity" });
      return;
    }

    await prisma.activityTag.deleteMany({
      where: { activityId, tag },
    });

    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to remove tag' });
  }
});

// History endpoint
router.get('/:id/history', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const activityId = parseInt(req.params.id, 10);
  if (isNaN(activityId)) {
    res.status(400).json({ detail: 'Invalid activity ID' });
    return;
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { trip: true },
    });

    if (!activity) {
      res.status(404).json({ detail: 'Activity not found' });
      return;
    }

    const isOwner = activity.trip.ownerId === authReq.user.id;
    const member = await prisma.tripMember.findFirst({
      where: { tripId: activity.tripId, userId: authReq.user.id },
    });
    const canView = isOwner || member;

    if (!canView) {
      res.status(403).json({ detail: "You don't have permission to view this activity" });
      return;
    }

    const history = await prisma.activityHistory.findMany({
      where: { activityId },
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
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      history.map((h) => ({
        id: h.id,
        activityId: h.activityId,
        userId: h.userId,
        user: h.user,
        action: h.action,
        changes: h.changes,
        createdAt: h.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get history' });
  }
});

router.patch('/reorder', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  try {
    const { activityIds } = req.body;

    if (!Array.isArray(activityIds) || activityIds.length === 0) {
      res.status(400).json({ detail: 'activityIds cannot be empty' });
      return;
    }

    const activities = await prisma.activity.findMany({
      where: { id: { in: activityIds } },
      include: { trip: true },
    });

    if (activities.length !== activityIds.length) {
      res.status(404).json({ detail: 'Some activities not found' });
      return;
    }

    for (const activity of activities) {
      const isOwner = activity.trip.ownerId === authReq.user.id;
      const member = await prisma.tripMember.findFirst({
        where: { tripId: activity.tripId, userId: authReq.user.id },
      });
      const isEditor = member?.role === 'owner' || member?.role === 'editor';

      if (!isOwner && !isEditor) {
        res.status(403).json({
          detail: `You don't have permission to reorder activities in trip ${activity.tripId}`,
        });
        return;
      }
    }

    for (let index = 0; index < activityIds.length; index++) {
      await prisma.activity.update({
        where: { id: activityIds[index] },
        data: { orderIndex: index },
      });
    }

    res.json({ message: 'Activities reordered successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to reorder activities' });
  }
});

export default router;

