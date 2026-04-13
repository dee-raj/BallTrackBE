import { Request, Response, NextFunction } from 'express';
import {
  createMatch,
  recordToss,
  startInnings,
  recordBall,
  undoLastBall,
  declareInnings,
  getMatchById,
  getAllMatches,
  getMatchScoreboard,
  getInningsScoreboard,
  getOverDetails,
  getMatchPerformance,
} from '../services';
import {
  createMatchSchema,
  tossSchema,
  ballInputSchema,
  startInningsSchema,
  updateMatchStatusSchema,
  declareInningsSchema,
} from '../dto';
import { validateBody } from '../../../middlewares/validate';
import prisma from '../../../database';

export class MatchesController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const matches = await getAllMatches();
      res.json(matches);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const match = await getMatchById(req.params.id);
      res.json(match);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMatchSchema.parse(req.body);
      const payload = (req as any).user as any;
      const match = await createMatch(data, payload?.id || '');
      res.status(201).json(match);
    } catch (error) {
      next(error);
    }
  }

  async recordToss(req: Request, res: Response, next: NextFunction) {
    try {
      const data = tossSchema.parse(req.body);
      const match = await recordToss(data);
      res.json(match);
    } catch (error) {
      next(error);
    }
  }

  async startInnings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = startInningsSchema.parse(req.body);
      const innings = await startInnings(data);
      res.status(201).json(innings);
    } catch (error) {
      next(error);
    }
  }

  async recordBall(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ballInputSchema.parse(req.body);
      const ball = await recordBall(data);
      res.status(201).json(ball);
    } catch (error) {
      next(error);
    }
  }

  async undo(req: Request, res: Response, next: NextFunction) {
    try {
      const ball = await undoLastBall(req.params.id);
      res.json({ removedBall: ball, message: 'Ball removed, stats recomputed' });
    } catch (error) {
      next(error);
    }
  }

  async declareInnings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = declareInningsSchema.parse(req.body);
      const innings = await declareInnings(data);
      res.json(innings);
    } catch (error) {
      next(error);
    }
  }

  async getScoreboard(req: Request, res: Response, next: NextFunction) {
    try {
      const scoreboard = await getMatchScoreboard(req.params.id);
      res.json(scoreboard);
    } catch (error) {
      next(error);
    }
  }

  async getInningsScoreboard(req: Request, res: Response, next: NextFunction) {
    try {
      const inningsNumber = parseInt(req.params.number);
      const scoreboard = await getInningsScoreboard(req.params.id, inningsNumber);
      res.json(scoreboard);
    } catch (error) {
      next(error);
    }
  }

  async getOver(req: Request, res: Response, next: NextFunction) {
    try {
      const overNumber = parseInt(req.params.overNumber);
      const over = await getOverDetails(req.params.id, overNumber);
      res.json(over);
    } catch (error) {
      next(error);
    }
  }

  async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const performance = await getMatchPerformance(req.params.id);
      res.json(performance);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.match.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const matchesController = new MatchesController();

export const createMatchValidation = validateBody(createMatchSchema);
export const tossValidation = validateBody(tossSchema);
export const ballValidation = validateBody(ballInputSchema);
export const startInningsValidation = validateBody(startInningsSchema);
export const declareValidation = validateBody(declareInningsSchema);