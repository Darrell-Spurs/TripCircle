import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { hashPassword, verifyPassword, createAccessToken } from '../utils/auth';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config';

const router = express.Router();

// Google OAuth setup (only if credentials are provided)
if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: `${config.backendUrl}/auth/google/callback`,
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Email not provided by Google'), undefined);
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || '',
              avatarUrl: profile.photos?.[0]?.value,
              provider: 'google',
            },
          });
        } else if (user.provider !== 'google') {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              avatarUrl: profile.photos?.[0]?.value,
              provider: 'google',
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
  );
} else {
  console.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      res.status(400).json({ detail: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        provider: 'email',
      },
    });

    const token = createAccessToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ detail: 'Incorrect email or password' });
      return;
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ detail: 'Incorrect email or password' });
      return;
    }

    const token = createAccessToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ detail: error.errors[0].message });
      return;
    }
    res.status(500).json({ detail: 'Login failed' });
  }
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  res.json({
    id: authReq.user.id,
    email: authReq.user.email,
    name: authReq.user.name,
    avatarUrl: authReq.user.avatarUrl,
    provider: authReq.user.provider,
  });
});

router.get('/google/login', (req: Request, res: Response) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    res.status(503).json({ detail: 'Google OAuth is not configured' });
    return;
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, () => {});
});

router.get('/google/callback', (req: Request, res: Response) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    res.status(503).json({ detail: 'Google OAuth is not configured' });
    return;
  }
  passport.authenticate('google', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      res.status(400).json({ detail: 'OAuth authentication failed' });
      return;
    }

    const token = createAccessToken(user.id);
    // Use the first frontend URL for OAuth callback redirect
    const frontendUrl = config.frontendUrls[0];

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  })(req, res, () => {});
});

export default router;

