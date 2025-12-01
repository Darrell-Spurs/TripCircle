import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    avatarUrl?: string | null;
    provider: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ detail: 'Not authenticated' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      res.status(401).json({ detail: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    };

    next();
  } catch (error) {
    res.status(401).json({ detail: 'Invalid authentication credentials' });
  }
}

export async function authenticateOptional(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined;
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      };
    }

    next();
  } catch (error) {
    req.user = undefined;
    next();
  }
}

