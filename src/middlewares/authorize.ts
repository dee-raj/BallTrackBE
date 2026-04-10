import { Request, Response, NextFunction } from 'express';
import { ROLE_HIERARCHY, UserRole } from '../shared/constants';
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

    const isAllowed = roles.some((role) => {
      const userLevel = ROLE_HIERARCHY[userRole];
      const requiredLevel = ROLE_HIERARCHY[role];
      return userLevel >= requiredLevel;
    });

    if (!isAllowed) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
