import { Request, Response, NextFunction } from 'express';
import { tournamentService } from '../services';
import { createTournamentSchema, updateTournamentSchema, addTeamsSchema } from '../dto';
import { validateBody } from '../../../middlewares/validate';

export class TournamentController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const tournaments = await tournamentService.getAllTournaments(tenantId);
      res.json(tournaments);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const tournament = await tournamentService.getTournament(req.params.id, tenantId);
      res.json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTournamentSchema.parse(req.body);
      const { id: userId, tenantId } = (req as any).user;
      const tournament = await tournamentService.createTournament(data, userId, tenantId);
      res.status(201).json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTournamentSchema.parse(req.body);
      const { tenantId } = (req as any).user;
      const tournament = await tournamentService.updateTournament(req.params.id, data, tenantId);
      res.json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      await tournamentService.deleteTournament(req.params.id, tenantId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamIds } = addTeamsSchema.parse(req.body);
      const { tenantId } = (req as any).user;
      await tournamentService.addTeamsToTournament(req.params.id, teamIds, tenantId);
      res.json({ message: 'Teams added to tournament' });
    } catch (error) {
      next(error);
    }
  }

  async removeTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      await tournamentService.removeTeamFromTournament(req.params.id, req.params.teamId, tenantId);
      res.json({ message: 'Team removed from tournament' });
    } catch (error) {
      next(error);
    }
  }

  async getPointsTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const pointsTable = await tournamentService.getPointsTable(req.params.id, tenantId);
      res.json(pointsTable);
    } catch (error) {
      next(error);
    }
  }
}

export const tournamentController = new TournamentController();

export const createTournamentValidation = validateBody(createTournamentSchema);
export const updateTournamentValidation = validateBody(updateTournamentSchema);
export const addTeamsValidation = validateBody(addTeamsSchema);
