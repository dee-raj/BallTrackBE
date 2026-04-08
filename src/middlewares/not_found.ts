import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './error_handler';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Route not found'));
}