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
  declareInningsSchema,
} from '../dto';
import { validateBody } from '../../../middlewares/validate';
import prisma from '../../../database';
import { ValidationError, ForbiddenError } from '../../../middlewares/error_handler';

export class MatchesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const matches = await getAllMatches(tenantId);
      res.json(matches);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const match = await getMatchById(req.params.id, tenantId);
      res.json(match);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMatchSchema.parse(req.body);
      const { id: userId, tenantId } = (req as any).user;
      const match = await createMatch(data, userId, tenantId);
      res.status(201).json(match);
    } catch (error) {
      next(error);
    }
  }

  async recordToss(req: Request, res: Response, next: NextFunction) {
    try {
      const data = tossSchema.parse(req.body);
      const { tenantId } = (req as any).user;
      const match = await recordToss(data, tenantId);
      res.json(match);
    } catch (error) {
      next(error);
    }
  }

  async startInnings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = startInningsSchema.parse(req.body);
      const { tenantId } = (req as any).user;
      const innings = await startInnings(data, tenantId);
      res.status(201).json(innings);
    } catch (error) {
      next(error);
    }
  }

  async recordBall(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ballInputSchema.parse(req.body);
      const { tenantId } = (req as any).user;
      const ball = await recordBall(data, tenantId);
      res.status(201).json(ball);
    } catch (error) {
      next(error);
    }
  }

  async undo(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const ball = await undoLastBall(req.params.id, tenantId);
      res.json({ removedBall: ball, message: 'Ball removed, stats recomputed' });
    } catch (error) {
      next(error);
    }
  }

  async declareInnings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = declareInningsSchema.parse(req.body);
      const { tenantId } = (req as any).user;
      const innings = await declareInnings(data, tenantId);
      res.json(innings);
    } catch (error) {
      next(error);
    }
  }

  async getScoreboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const scoreboard = await getMatchScoreboard(req.params.id, tenantId);
      res.json(scoreboard);
    } catch (error) {
      next(error);
    }
  }

  async getInningsScoreboard(req: Request, res: Response, next: NextFunction) {
    try {
      const inningsNumber = parseInt(req.params.number);
      if (isNaN(inningsNumber) || inningsNumber < 1) {
        throw new ValidationError('Invalid innings number');
      }
      const { tenantId } = (req as any).user;
      const scoreboard = await getInningsScoreboard(req.params.id, inningsNumber, tenantId);
      res.json(scoreboard);
    } catch (error) {
      next(error);
    }
  }

  async getOver(req: Request, res: Response, next: NextFunction) {
    try {
      const overNumber = parseInt(req.params.overNumber);
      if (isNaN(overNumber) || overNumber < 1) {
        throw new ValidationError('Invalid over number');
      }
      const { tenantId } = (req as any).user;
      const over = await getOverDetails(req.params.id, overNumber, tenantId);
      res.json(over);
    } catch (error) {
      next(error);
    }
  }

  async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      const performance = await getMatchPerformance(req.params.id, tenantId);
      res.json(performance);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = (req as any).user;
      // Verify ownership before hard delete
      const match = await prisma.match.findFirst({
        where: { id: req.params.id, tenantId },
      });
      if (!match) throw new ForbiddenError('Match not found or access denied');
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