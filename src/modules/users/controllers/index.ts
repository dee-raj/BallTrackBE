import { Request, Response, NextFunction } from 'express';
import { usersService } from '../services';
import { updateProfileSchema, changePasswordSchema } from '../dto';
import { validateBody } from '../../../middlewares/validate';
import { z } from 'zod';

const inviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(255),
  password: z.string().min(6),
  role: z.literal('scorer'),
});

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = (req as any).user as any;
      const user = await usersService.getProfile(payload.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = (req as any).user as any;
      const data = updateProfileSchema.parse(req.body);
      const user = await usersService.updateProfile(payload.id, data);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = (req as any).user as any;
      const data = changePasswordSchema.parse(req.body);
      const result = await usersService.changePassword(payload.id, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /** Admin-only: list all users within the caller's tenant */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const users = await usersService.getAllUsers(tenantId);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  /** Admin-only: create a scorer account within the caller's tenant */
  async inviteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const data = inviteUserSchema.parse(req.body);
      const user = await usersService.inviteUser(data, tenantId);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
export const updateProfileValidation = validateBody(updateProfileSchema);
export const changePasswordValidation = validateBody(changePasswordSchema);
export const inviteUserValidation = validateBody(inviteUserSchema);
