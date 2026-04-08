import { Request, Response, NextFunction } from 'express';
import { teamsService } from '../services';
import { createTeamSchema, updateTeamSchema } from '../dto';
import { validateBody } from '../../../middlewares/validate';
import { UserRole } from '../../../shared/constants';

export class TeamsController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const teams = await teamsService.getAll();
      res.json(teams);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamsService.getById(req.params.id);
      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTeamSchema.parse(req.body);
      const payload = (req as any).user as any;
      const team = await teamsService.create(data, payload?.id || '');
      res.status(201).json(team);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTeamSchema.parse(req.body);
      const team = await teamsService.update(req.params.id, data);
      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await teamsService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const teamsController = new TeamsController();
export const createTeamValidation = validateBody(createTeamSchema);
export const updateTeamValidation = validateBody(updateTeamSchema);