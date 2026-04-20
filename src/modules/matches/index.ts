import { Router } from 'express';
import { matchesController, createMatchValidation, updateMatchValidation, ballValidation, startInningsValidation, declareValidation } from './controllers';
import { authenticate, optionalAuthenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

// Match viewing is public (optional auth for tenant scoping)
router.get(
  '/',
  optionalAuthenticate,
  matchesController.getAll.bind(matchesController)
);

router.get(
  '/:id',
  optionalAuthenticate,
  matchesController.getById.bind(matchesController)
);

router.post(
  '/',
  authenticate,
  authorize(UserRole.admin),
  createMatchValidation,
  matchesController.create.bind(matchesController)
);

router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.admin),
  updateMatchValidation,
  matchesController.update.bind(matchesController)
);

router.post(
  '/toss',
  authenticate,
  authorize(UserRole.scorer),
  matchesController.recordToss.bind(matchesController)
);

router.post(
  '/innings',
  authenticate,
  authorize(UserRole.scorer),
  startInningsValidation,
  matchesController.startInnings.bind(matchesController)
);

router.post(
  '/ball',
  authenticate,
  authorize(UserRole.scorer),
  ballValidation,
  matchesController.recordBall.bind(matchesController)
);

router.post(
  '/:id/undo',
  authenticate,
  authorize(UserRole.scorer),
  matchesController.undo.bind(matchesController)
);

router.post(
  '/declare',
  authenticate,
  authorize(UserRole.scorer),
  declareValidation,
  matchesController.declareInnings.bind(matchesController)
);

router.get(
  '/:id/scoreboard',
  optionalAuthenticate,
  matchesController.getScoreboard.bind(matchesController)
);

router.get(
  '/:id/innings/:number',
  optionalAuthenticate,
  matchesController.getInningsScoreboard.bind(matchesController)
);

router.get(
  '/:id/over/:overNumber',
  optionalAuthenticate,
  matchesController.getOver.bind(matchesController)
);

router.get(
  '/:id/performance',
  optionalAuthenticate,
  matchesController.getPerformance.bind(matchesController)
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.admin),
  matchesController.delete.bind(matchesController)
);

export default router;