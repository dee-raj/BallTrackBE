import { Request, Response, NextFunction } from 'express';
import { usersService } from '../services';
import { updateProfileSchema } from '../dto';
import { validateBody } from '../../../middlewares/validate';
import { UserRole } from '../../../shared/constants';
import { authorize } from '../../../middlewares/authorize';
import { JwtPayload } from '../../../middlewares/authenticate';

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

  async getAllUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
export const updateProfileValidation = validateBody(updateProfileSchema);