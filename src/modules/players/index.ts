import { Router } from 'express';
import { playersController, createPlayerValidation, updatePlayerValidation, addToTeamValidation } from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

router.get('/', authenticate, playersController.getAll.bind(playersController));
router.get('/team/:teamId', authenticate, playersController.getTeamPlayers.bind(playersController));
router.post('/team/:teamId', authenticate, authorize(UserRole.scorer), addToTeamValidation, playersController.addToTeam.bind(playersController));
router.delete('/team/:teamId/:playerId', authenticate, authorize(UserRole.scorer), playersController.removeFromTeam.bind(playersController));

router.get('/:id', authenticate, playersController.getById.bind(playersController));
router.post('/', authenticate, authorize(UserRole.scorer), createPlayerValidation, playersController.create.bind(playersController));
router.patch('/:id', authenticate, authorize(UserRole.scorer), updatePlayerValidation, playersController.update.bind(playersController));
router.delete('/:id', authenticate, authorize(UserRole.admin), playersController.delete.bind(playersController));

export default router;