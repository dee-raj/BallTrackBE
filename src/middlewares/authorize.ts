import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../shared/constants';
import { ForbiddenError } from './error_handler';

type Role = UserRole | UserRole[];

export function authorize(allowedRoles: Role) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user as any;
    if (!user) {
      next(new ForbiddenError('No user authenticated'));
      return;
    }

    const userRole = user.role as UserRole;

    if (!roles.includes(userRole)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}