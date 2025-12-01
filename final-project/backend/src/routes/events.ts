import express, { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticateOptional, AuthRequest } from '../middleware/auth';

const router = express.Router();

const eventLogSchema = z.object({
  eventType: z.string(),
  metadata: z.record(z.any()).optional(),
  tripId: z.number().optional(),
});

router.post('/', authenticateOptional, async (req: AuthRequest, res: Response) => {
  try {
    const data = eventLogSchema.parse(req.body);

    const event = await prisma.event.create({
      data: {
        userId: req.user?.id || null,
        tripId: data.tripId || null,
        eventType: data.eventType,
        metadata: data.metadata || {},
      },
    });

    res.json({
      id: event.id,
      eventType: event.eventType,
      createdAt: event.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Failed to log event' });
  }
});

export default router;

