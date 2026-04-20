import { Router } from 'express';
import { tournamentController, createTournamentValidation, updateTournamentValidation, addTeamsValidation } from './controllers';
import { authenticate, optionalAuthenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

// Tournament reading is public
router.get(
  '/',
  optionalAuthenticate,
  tournamentController.getAll.bind(tournamentController)
);

router.get(
  '/:id',
  optionalAuthenticate,
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
  optionalAuthenticate,
  tournamentController.getPointsTable.bind(tournamentController)
);

export default router;
