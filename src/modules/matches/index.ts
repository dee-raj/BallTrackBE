import { Router } from 'express';
import { matchesController, createMatchValidation, ballValidation, startInningsValidation, declareValidation } from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

router.get(
    '/',
    matchesController.getAll.bind(matchesController)
);
router.get(
    '/:id',
    matchesController.getById.bind(matchesController)
);
router.post(
    '/',
    authenticate,
    authorize(UserRole.scorer),
    createMatchValidation,
    matchesController.create.bind(matchesController)
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
    matchesController.getScoreboard.bind(matchesController)
);
router.get(
    '/:id/innings/:number',
    matchesController.getInningsScoreboard.bind(matchesController)
);
router.get(
    '/:id/over/:overNumber',
    matchesController.getOver.bind(matchesController)
);

router.delete(
    '/:id',
    authenticate,
    authorize(UserRole.admin),
    matchesController.delete.bind(matchesController)
);

export default router;