import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
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

interface JwtDecoded {
  sub: number;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  (async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ detail: 'Not authenticated' });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtSecret) as unknown as JwtDecoded;

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        res.status(401).json({ detail: 'User not found' });
        return;
      }

      (req as AuthRequest).user = {
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
  })();
}

export function authenticateOptional(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  (async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (req as AuthRequest).user = undefined;
        next();
        return;
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtSecret) as unknown as JwtDecoded;

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (user) {
        (req as AuthRequest).user = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          provider: user.provider,
        };
      }

      next();
    } catch (error) {
      (req as AuthRequest).user = undefined;
      next();
    }
  })();
}

