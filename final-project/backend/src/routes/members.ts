import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'editor', 'viewer']).default('viewer'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

router.get('/trips/:tripId/members', authenticate, async (req: Request, res: Response) => {
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

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    res.status(404).json({ detail: 'Trip not found' });
    return;
  }

  const isOwner = trip.ownerId === authReq.user.id;
  const isMember = await prisma.tripMember.findFirst({
    where: { tripId, userId: authReq.user.id },
  });

  if (!isOwner && !isMember) {
    res.status(403).json({ detail: "You don't have access to this trip" });
    return;
  }

  const members = await prisma.tripMember.findMany({
    where: { tripId },
    include: { user: true },
  });

  res.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      user: {
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
      },
    })),
  });
});

router.post('/trips/:tripId/members', authenticate, async (req: Request, res: Response) => {
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

    if (trip.ownerId !== authReq.user.id) {
      res.status(403).json({ detail: 'Only the owner can invite members' });
      return;
    }

    const data = inviteMemberSchema.parse(req.body);
    const invitedUser = await prisma.user.findUnique({ where: { email: data.email } });

    if (!invitedUser) {
      res.status(404).json({ detail: 'User with this email not found' });
      return;
    }

    const existingMember = await prisma.tripMember.findFirst({
      where: { tripId, userId: invitedUser.id },
    });

    if (existingMember) {
      res.status(400).json({ detail: 'User is already a member of this trip' });
      return;
    }

    const member = await prisma.tripMember.create({
      data: {
        tripId,
        userId: invitedUser.id,
        role: data.role,
      },
    });

    res.json({
      id: member.id,
      userId: member.userId,
      role: member.role,
      user: {
        id: invitedUser.id,
        email: invitedUser.email,
        name: invitedUser.name,
        avatarUrl: invitedUser.avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Failed to invite member' });
  }
});

router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const memberId = parseInt(req.params.id, 10);
  if (isNaN(memberId)) {
    res.status(400).json({ detail: 'Invalid member ID' });
    return;
  }

  try {
    const member = await prisma.tripMember.findUnique({
      where: { id: memberId },
      include: { trip: true },
    });

    if (!member) {
      res.status(404).json({ detail: 'Member not found' });
      return;
    }

    if (member.trip.ownerId !== authReq.user.id) {
      res.status(403).json({ detail: 'Only the owner can update member roles' });
      return;
    }

    if (member.role === 'owner') {
      res.status(400).json({ detail: 'Cannot change owner role' });
      return;
    }

    const data = updateMemberRoleSchema.parse(req.body);
    const updatedMember = await prisma.tripMember.update({
      where: { id: memberId },
      data: { role: data.role },
    });

    res.json({
      id: updatedMember.id,
      userId: updatedMember.userId,
      role: updatedMember.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Failed to update member role' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const memberId = parseInt(req.params.id, 10);
  if (isNaN(memberId)) {
    res.status(400).json({ detail: 'Invalid member ID' });
    return;
  }

  const member = await prisma.tripMember.findUnique({
    where: { id: memberId },
    include: { trip: true },
  });

  if (!member) {
    res.status(404).json({ detail: 'Member not found' });
    return;
  }

  if (member.trip.ownerId !== authReq.user.id) {
    res.status(403).json({ detail: 'Only the owner can remove members' });
    return;
  }

  if (member.role === 'owner') {
    res.status(400).json({ detail: 'Cannot remove the owner' });
    return;
  }

  await prisma.tripMember.delete({ where: { id: memberId } });

  res.json({ message: 'Member removed successfully' });
});

export default router;

