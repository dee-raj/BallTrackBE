import { Router } from 'express';
import { teamsController, createTeamValidation, updateTeamValidation } from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';
import { playersController, addToTeamValidation, removeFromTeamValidation } from '../players/controllers';

const router = Router();

// All team endpoints require authentication — tenantId is extracted from JWT
router.get(
  '/',
  authenticate,
  teamsController.getAll.bind(teamsController)
);

router.get(
  '/:id',
  authenticate,
  teamsController.getById.bind(teamsController)
);

router.post(
  '/',
  authenticate,
  authorize(UserRole.admin),
  createTeamValidation,
  teamsController.create.bind(teamsController)
);

router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.admin),
  updateTeamValidation,
  teamsController.update.bind(teamsController)
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.admin),
  teamsController.delete.bind(teamsController)
);

// Team → Players sub-routes
router.get(
  '/:teamId/players',
  authenticate,
  playersController.getTeamPlayers.bind(playersController)
);

router.post(
  '/:teamId/players',
  authenticate,
  authorize(UserRole.admin),
  addToTeamValidation,
  playersController.addToTeam.bind(playersController)
);

router.delete(
  '/:teamId/players/:playerId',
  authenticate,
  authorize(UserRole.admin),
  removeFromTeamValidation,
  playersController.removeFromTeam.bind(playersController)
);

export default router;