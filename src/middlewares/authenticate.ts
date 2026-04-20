import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../database';
import { UnauthorizedError } from './error_handler';
import { safeUserSelect } from '../shared/user';
import { UserRole } from '../shared/constants';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string | null; // null/undefined for superadmin
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const isSuperAdmin = decoded.role === UserRole.superadmin;

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        ...(isSuperAdmin ? {} : { tenantId: decoded.tenantId ?? undefined }),
      },
      select: safeUserSelect,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    (req as any).user = user;
    next();

  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
}

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const isSuperAdmin = decoded.role === UserRole.superadmin;

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        ...(isSuperAdmin ? {} : { tenantId: decoded.tenantId ?? undefined }),
      },
      select: safeUserSelect,
    });

    if (user && user.isActive) {
      (req as any).user = user;
    }
    next();
  } catch (error) {
    // If token is invalid, we just treat them as guest instead of throwing
    next();
  }
}
