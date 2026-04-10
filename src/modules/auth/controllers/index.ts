import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { loginSchema, registerSchema } from '../dto';
import { validateBody } from '../../../middlewares/validate';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json((req as any).user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

export const registerValidation = validateBody(registerSchema);
export const loginValidation = validateBody(loginSchema);