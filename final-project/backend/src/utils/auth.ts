import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function createAccessToken(userId: number): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    algorithm: config.jwtAlgorithm,
    expiresIn: '24h',
  });
}

