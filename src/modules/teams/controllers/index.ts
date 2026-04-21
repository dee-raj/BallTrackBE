import { Request, Response, NextFunction } from 'express';
import { teamsService } from '../services';
import { createTeamSchema, updateTeamSchema } from '../dto';
import { validateBody } from '../../../middlewares/validate';

export class TeamsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      const teams = await teamsService.getAll(tenantId);
      res.json(teams);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      const team = await teamsService.getById(req.params.id, tenantId);
      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTeamSchema.parse(req.body);
      const { id: userId, tenantId } = (req as any).user;
      if (!tenantId) {
        return res.status(400).json({ message: 'User must belong to a tenant to create a team.' });
      }
      const team = await teamsService.create(data, userId, tenantId);
      res.status(201).json(team);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTeamSchema.parse(req.body);
      const { tenantId } = (req as any).user;
      const team = await teamsService.update(req.params.id, data, tenantId);
      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      await teamsService.delete(req.params.id, tenantId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const teamsController = new TeamsController();
export const createTeamValidation = validateBody(createTeamSchema);
export const updateTeamValidation = validateBody(updateTeamSchema);