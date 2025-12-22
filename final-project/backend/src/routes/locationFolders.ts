import express, { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../database';
import { authenticate, authenticateOptional, AuthRequest } from '../middleware/auth';

const router = express.Router();

const createLocationFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

const updateLocationFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

const saveLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateLocationSchema = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const createShareLinkSchema = z.object({
  permission: z.enum(['view', 'edit']).default('view'),
  expiresAt: z.string().datetime().optional(),
});

function generateShareToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// POST /location-folders - Create new folder
router.post('/', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  try {
    const data = createLocationFolderSchema.parse(req.body);

    const folder = await prisma.locationFolder.create({
      data: {
        userId: authReq.user.id,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
      },
      include: {
        _count: {
          select: { locations: true },
        },
      },
    });

    res.status(201).json({
      id: folder.id,
      userId: folder.userId,
      name: folder.name,
      description: folder.description,
      isPublic: folder.isPublic,
      locationsCount: folder._count.locations,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    console.error('Error creating location folder:', error);
    res.status(500).json({ detail: 'Failed to create folder' });
  }
});

// GET /location-folders - List user's folders
router.get('/', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const includeLocations = req.query.includeLocations === 'true';

  try {
    const folders = await prisma.locationFolder.findMany({
      where: { userId: authReq.user.id },
      include: {
        _count: {
          select: { locations: true },
        },
        ...(includeLocations && {
          locations: {
            orderBy: { createdAt: 'desc' },
          },
        }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(
      folders.map((folder) => ({
        id: folder.id,
        userId: folder.userId,
        name: folder.name,
        description: folder.description,
        isPublic: folder.isPublic,
        locationsCount: folder._count.locations,
        locations: includeLocations
          ? folder.locations.map((loc) => ({
              id: loc.id,
              folderId: loc.folderId,
              name: loc.name,
              address: loc.address,
              lat: loc.lat,
              lng: loc.lng,
              placeId: loc.placeId,
              notes: loc.notes,
              tags: (loc.tags as string[]) || [],
              createdAt: loc.createdAt.toISOString(),
              updatedAt: loc.updatedAt.toISOString(),
            }))
          : undefined,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching location folders:', error);
    res.status(500).json({ detail: 'Failed to fetch folders' });
  }
});

// GET /location-folders/:id - Get folder with locations
router.get('/:id', authenticateOptional, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const folderId = parseInt(req.params.id, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ detail: 'Invalid folder ID' });
    return;
  }

  try {
    const folder = await prisma.locationFolder.findUnique({
      where: { id: folderId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            provider: true,
          },
        },
        locations: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { locations: true },
        },
      },
    });

    if (!folder) {
      res.status(404).json({ detail: 'Folder not found' });
      return;
    }

    // Check permissions
    const isOwner = folder.userId === authReq.user?.id;
    const isPublic = folder.isPublic;
    const isMember = authReq.user
      ? await prisma.locationFolderMember.findFirst({
          where: { folderId, userId: authReq.user.id },
        })
      : null;

    if (!isOwner && !isPublic && !isMember) {
      res.status(403).json({ detail: "You don't have access to this folder" });
      return;
    }

    res.json({
      id: folder.id,
      userId: folder.userId,
      name: folder.name,
      description: folder.description,
      isPublic: folder.isPublic,
      owner: folder.owner,
      locationsCount: folder._count.locations,
      locations: folder.locations.map((loc) => ({
        id: loc.id,
        folderId: loc.folderId,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        placeId: loc.placeId,
        notes: loc.notes,
        tags: (loc.tags as string[]) || [],
        createdAt: loc.createdAt.toISOString(),
        updatedAt: loc.updatedAt.toISOString(),
      })),
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching location folder:', error);
    res.status(500).json({ detail: 'Failed to fetch folder' });
  }
});

// PUT /location-folders/:id - Update folder
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const folderId = parseInt(req.params.id, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ detail: 'Invalid folder ID' });
    return;
  }

  try {
    const folder = await prisma.locationFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      res.status(404).json({ detail: 'Folder not found' });
      return;
    }

    if (folder.userId !== authReq.user.id) {
      res.status(403).json({ detail: 'Only the owner can update this folder' });
      return;
    }

    const data = updateLocationFolderSchema.parse(req.body);

    const updatedFolder = await prisma.locationFolder.update({
      where: { id: folderId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
      include: {
        _count: {
          select: { locations: true },
        },
      },
    });

    res.json({
      id: updatedFolder.id,
      userId: updatedFolder.userId,
      name: updatedFolder.name,
      description: updatedFolder.description,
      isPublic: updatedFolder.isPublic,
      locationsCount: updatedFolder._count.locations,
      createdAt: updatedFolder.createdAt.toISOString(),
      updatedAt: updatedFolder.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    console.error('Error updating location folder:', error);
    res.status(500).json({ detail: 'Failed to update folder' });
  }
});

// DELETE /location-folders/:id - Delete folder
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const folderId = parseInt(req.params.id, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ detail: 'Invalid folder ID' });
    return;
  }

  try {
    const folder = await prisma.locationFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      res.status(404).json({ detail: 'Folder not found' });
      return;
    }

    if (folder.userId !== authReq.user.id) {
      res.status(403).json({ detail: 'Only the owner can delete this folder' });
      return;
    }

    await prisma.locationFolder.delete({
      where: { id: folderId },
    });

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting location folder:', error);
    res.status(500).json({ detail: 'Failed to delete folder' });
  }
});

// POST /location-folders/:id/locations - Save location to folder
router.post('/:id/locations', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const folderId = parseInt(req.params.id, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ detail: 'Invalid folder ID' });
    return;
  }

  try {
    const folder = await prisma.locationFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      res.status(404).json({ detail: 'Folder not found' });
      return;
    }

    // Check permissions
    const isOwner = folder.userId === authReq.user.id;
    const member = await prisma.locationFolderMember.findFirst({
      where: { folderId, userId: authReq.user.id },
    });
    const canEdit = isOwner || member?.role === 'editor';

    if (!canEdit) {
      res.status(403).json({ detail: "You don't have permission to add locations to this folder" });
      return;
    }

    const data = saveLocationSchema.parse(req.body);

    const location = await prisma.savedLocation.create({
      data: {
        folderId,
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        placeId: data.placeId,
        notes: data.notes,
        tags: data.tags || [],
      },
    });

    res.status(201).json({
      id: location.id,
      folderId: location.folderId,
      name: location.name,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      placeId: location.placeId,
      notes: location.notes,
      tags: (location.tags as string[]) || [],
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    console.error('Error saving location:', error);
    res.status(500).json({ detail: 'Failed to save location' });
  }
});

// DELETE /location-folders/:id/locations/:locationId - Remove location from folder
router.delete('/:id/locations/:locationId', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const folderId = parseInt(req.params.id, 10);
  const locationId = parseInt(req.params.locationId, 10);
  if (isNaN(folderId) || isNaN(locationId)) {
    res.status(400).json({ detail: 'Invalid folder or location ID' });
    return;
  }

  try {
    const location = await prisma.savedLocation.findUnique({
      where: { id: locationId },
      include: { folder: true },
    });

    if (!location || location.folderId !== folderId) {
      res.status(404).json({ detail: 'Location not found in this folder' });
      return;
    }

    // Check permissions
    const isOwner = location.folder.userId === authReq.user.id;
    const member = await prisma.locationFolderMember.findFirst({
      where: { folderId, userId: authReq.user.id },
    });
    const canEdit = isOwner || member?.role === 'editor';

    if (!canEdit) {
      res.status(403).json({ detail: "You don't have permission to remove locations from this folder" });
      return;
    }

    await prisma.savedLocation.delete({
      where: { id: locationId },
    });

    res.json({ message: 'Location removed successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ detail: 'Failed to delete location' });
  }
});

// PUT /location-folders/:id/locations/:locationId - Update location (notes/tags)
router.put('/:id/locations/:locationId', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const folderId = parseInt(req.params.id, 10);
  const locationId = parseInt(req.params.locationId, 10);
  if (isNaN(folderId) || isNaN(locationId)) {
    res.status(400).json({ detail: 'Invalid folder or location ID' });
    return;
  }

  try {
    const location = await prisma.savedLocation.findUnique({
      where: { id: locationId },
      include: { folder: true },
    });

    if (!location || location.folderId !== folderId) {
      res.status(404).json({ detail: 'Location not found in this folder' });
      return;
    }

    // Check permissions
    const isOwner = location.folder.userId === authReq.user.id;
    const member = await prisma.locationFolderMember.findFirst({
      where: { folderId, userId: authReq.user.id },
    });
    const canEdit = isOwner || member?.role === 'editor';

    if (!canEdit) {
      res.status(403).json({ detail: "You don't have permission to update locations in this folder" });
      return;
    }

    const data = updateLocationSchema.parse(req.body);

    const updatedLocation = await prisma.savedLocation.update({
      where: { id: locationId },
      data: {
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });

    res.json({
      id: updatedLocation.id,
      folderId: updatedLocation.folderId,
      name: updatedLocation.name,
      address: updatedLocation.address,
      lat: updatedLocation.lat,
      lng: updatedLocation.lng,
      placeId: updatedLocation.placeId,
      notes: updatedLocation.notes,
      tags: (updatedLocation.tags as string[]) || [],
      createdAt: updatedLocation.createdAt.toISOString(),
      updatedAt: updatedLocation.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    console.error('Error updating location:', error);
    res.status(500).json({ detail: 'Failed to update location' });
  }
});

// POST /location-folders/:id/share-links - Create share link
router.post('/:id/share-links', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const folderId = parseInt(req.params.id, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ detail: 'Invalid folder ID' });
    return;
  }

  try {
    const folder = await prisma.locationFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      res.status(404).json({ detail: 'Folder not found' });
      return;
    }

    if (folder.userId !== authReq.user.id) {
      res.status(403).json({ detail: 'Only the owner can create share links' });
      return;
    }

    const data = createShareLinkSchema.parse(req.body);
    const token = generateShareToken();

    const shareLink = await prisma.locationFolderShareLink.create({
      data: {
        folderId,
        token,
        permission: data.permission,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    res.json({
      id: shareLink.id,
      folderId: shareLink.folderId,
      token: shareLink.token,
      permission: shareLink.permission,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      url: `/location-folders/shared/${shareLink.token}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    console.error('Error creating share link:', error);
    res.status(500).json({ detail: 'Failed to create share link' });
  }
});

// GET /location-folders/shared/:token - Access shared folder
router.get('/shared/:token', authenticateOptional, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { token } = req.params;

  try {
    const shareLink = await prisma.locationFolderShareLink.findUnique({
      where: { token },
      include: {
        folder: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                provider: true,
              },
            },
            locations: {
              orderBy: { createdAt: 'desc' },
            },
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

    const folder = shareLink.folder;

    res.json({
      folder: {
        id: folder.id,
        userId: folder.userId,
        name: folder.name,
        description: folder.description,
        isPublic: folder.isPublic,
        owner: folder.owner,
        locations: folder.locations.map((loc) => ({
          id: loc.id,
          folderId: loc.folderId,
          name: loc.name,
          address: loc.address,
          lat: loc.lat,
          lng: loc.lng,
          placeId: loc.placeId,
          notes: loc.notes,
          tags: (loc.tags as string[]) || [],
          createdAt: loc.createdAt.toISOString(),
          updatedAt: loc.updatedAt.toISOString(),
        })),
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      },
      permission: shareLink.permission,
      isShared: true,
    });
  } catch (error) {
    console.error('Error fetching shared folder:', error);
    res.status(500).json({ detail: 'Failed to fetch shared folder' });
  }
});

// POST /location-folders/:id/import - Import folder to user's account (copy)
router.post('/:id/import', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const folderId = parseInt(req.params.id, 10);
  if (isNaN(folderId)) {
    res.status(400).json({ detail: 'Invalid folder ID' });
    return;
  }

  try {
    const sourceFolder = await prisma.locationFolder.findUnique({
      where: { id: folderId },
      include: {
        locations: true,
      },
    });

    if (!sourceFolder) {
      res.status(404).json({ detail: 'Folder not found' });
      return;
    }

    // Check if user has access (owner, public, or member)
    const isOwner = sourceFolder.userId === authReq.user.id;
    const isPublic = sourceFolder.isPublic;
    const isMember = await prisma.locationFolderMember.findFirst({
      where: { folderId, userId: authReq.user.id },
    });

    if (!isOwner && !isPublic && !isMember) {
      res.status(403).json({ detail: "You don't have access to this folder" });
      return;
    }

    // Create new folder for the user
    const newFolder = await prisma.locationFolder.create({
      data: {
        userId: authReq.user.id,
        name: `${sourceFolder.name} (Imported)`,
        description: sourceFolder.description,
        isPublic: false, // Imported folders are private by default
      },
    });

    // Copy all locations
    if (sourceFolder.locations.length > 0) {
      await prisma.savedLocation.createMany({
        data: sourceFolder.locations.map((loc) => ({
          folderId: newFolder.id,
          name: loc.name,
          address: loc.address,
          lat: loc.lat,
          lng: loc.lng,
          placeId: loc.placeId,
          notes: loc.notes,
          tags: loc.tags,
        })),
      });
    }

    // Fetch the created folder with count
    const importedFolder = await prisma.locationFolder.findUnique({
      where: { id: newFolder.id },
      include: {
        _count: {
          select: { locations: true },
        },
      },
    });

    res.status(201).json({
      id: importedFolder!.id,
      userId: importedFolder!.userId,
      name: importedFolder!.name,
      description: importedFolder!.description,
      isPublic: importedFolder!.isPublic,
      locationsCount: importedFolder!._count.locations,
      createdAt: importedFolder!.createdAt.toISOString(),
      updatedAt: importedFolder!.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error importing folder:', error);
    res.status(500).json({ detail: 'Failed to import folder' });
  }
});

export default router;

