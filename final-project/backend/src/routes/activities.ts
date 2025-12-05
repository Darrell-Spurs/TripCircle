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
      },
    });

    res.json({
      id: activity.id,
      tripId: activity.tripId,
      date: activity.date.toISOString(),
      startTime: activity.startTime?.toISOString() || null,
      endTime: activity.endTime?.toISOString() || null,
      title: activity.title,
      notes: activity.notes,
      body: activity.body,
      placeId: activity.placeId,
      locationName: activity.locationName,
      address: activity.address,
      lat: activity.lat,
      lng: activity.lng,
      orderIndex: activity.orderIndex,
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
    const updateData: any = {};

    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.startTime !== undefined) updateData.startTime = data.startTime ? new Date(data.startTime) : null;
    if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.body !== undefined) updateData.body = data.body || null;
    if (data.placeId !== undefined) updateData.placeId = data.placeId || null;
    if (data.locationName !== undefined) updateData.locationName = data.locationName || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.lat !== undefined) updateData.lat = data.lat || null;
    if (data.lng !== undefined) updateData.lng = data.lng || null;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: updateData,
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

