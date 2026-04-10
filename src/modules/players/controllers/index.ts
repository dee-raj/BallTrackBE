import { Request, Response, NextFunction } from 'express';
import { playersService } from '../services';
import {
  createPlayerSchema,
  updatePlayerSchema,
  addPlayerToTeamSchema,
  removePlayerFromTeamSchema,
} from '../dto';
import { validateBody } from '../../../middlewares/validate';
import { UserRole } from '../../../shared/constants';

export class PlayersController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const players = await playersService.getAll();
      res.json(players);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const player = await playersService.getById(req.params.id);
      res.json(player);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPlayerSchema.parse(req.body);
      const payload = (req as any).user as any;
      const player = await playersService.create(data, (payload?.role || 'scorer') as UserRole);
      res.status(201).json(player);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updatePlayerSchema.parse(req.body);
      const player = await playersService.update(req.params.id, data);
      res.json(player);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await playersService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addToTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addPlayerToTeamSchema.parse(req.body);
      const teamPlayer = await playersService.addToTeam(req.params.teamId, data);
      res.status(201).json(teamPlayer);
    } catch (error) {
      next(error);
    }
  }

  async removeFromTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamId, playerId } = req.params;
      const data = removePlayerFromTeamSchema.parse({ teamId, playerId });
      await playersService.removeFromTeam(data);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getTeamPlayers(req: Request, res: Response, next: NextFunction) {
    try {
      const teamPlayers = await playersService.getTeamPlayers(req.params.teamId);
      res.json(teamPlayers);
    } catch (error) {
      next(error);
    }
  }
}

export const playersController = new PlayersController();

export const createPlayerValidation = validateBody(createPlayerSchema);
export const updatePlayerValidation = validateBody(updatePlayerSchema);
export const addToTeamValidation = validateBody(addPlayerToTeamSchema);
export const removeFromTeamValidation = validateBody(removePlayerFromTeamSchema);