import { Request, Response, NextFunction } from 'express';
import { tournamentService } from '../services';
import { createTournamentSchema, updateTournamentSchema, addTeamsSchema } from '../dto';
import { validateBody } from '../../../middlewares/validate';

export class TournamentController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const tournaments = await tournamentService.getAllTournaments();
      res.json(tournaments);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tournament = await tournamentService.getTournament(req.params.id);
      res.json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTournamentSchema.parse(req.body);
      const user = (req as any).user;
      const tournament = await tournamentService.createTournament(data, user.id);
      res.status(201).json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTournamentSchema.parse(req.body);
      const tournament = await tournamentService.updateTournament(req.params.id, data);
      res.json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await tournamentService.deleteTournament(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamIds } = addTeamsSchema.parse(req.body);
      await tournamentService.addTeamsToTournament(req.params.id, teamIds);
      res.json({ message: 'Teams added to tournament' });
    } catch (error) {
      next(error);
    }
  }

  async removeTeam(req: Request, res: Response, next: NextFunction) {
    try {
      await tournamentService.removeTeamFromTournament(req.params.id, req.params.teamId);
      res.json({ message: 'Team removed from tournament' });
    } catch (error) {
      next(error);
    }
  }

  async getPointsTable(req: Request, res: Response, next: NextFunction) {
    try {
      const pointsTable = await tournamentService.getPointsTable(req.params.id);
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
