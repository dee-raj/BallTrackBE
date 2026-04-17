import { Router } from 'express';
import { tournamentController, createTournamentValidation, updateTournamentValidation, addTeamsValidation } from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

router.get(
  '/',
  tournamentController.getAll.bind(tournamentController)
);

router.get(
  '/:id',
  tournamentController.getById.bind(tournamentController)
);

router.post(
  '/',
  authenticate,
  authorize(UserRole.admin),
  createTournamentValidation,
  tournamentController.create.bind(tournamentController)
);

router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.admin),
  updateTournamentValidation,
  tournamentController.update.bind(tournamentController)
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.admin),
  tournamentController.delete.bind(tournamentController)
);

router.post(
  '/:id/teams',
  authenticate,
  authorize(UserRole.admin),
  addTeamsValidation,
  tournamentController.addTeams.bind(tournamentController)
);

router.delete(
  '/:id/teams/:teamId',
  authenticate,
  authorize(UserRole.admin),
  tournamentController.removeTeam.bind(tournamentController)
);

router.get(
  '/:id/points-table',
  tournamentController.getPointsTable.bind(tournamentController)
);

export default router;
